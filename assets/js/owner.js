document.addEventListener('DOMContentLoaded', () => {
    'use strict';

    const API_URL = 'http://localhost:3000';
    const SESSION_KEY_ROLE = 'p21_auth_role';

    const logoutButton = document.getElementById('logout-button');
    const transactionsBody = document.getElementById('transactions-body');
    const filterDate = document.getElementById('filter-date');
    const filterType = document.getElementById('filter-type');
    const filterButton = document.getElementById('filter-button');

    // Security Check
    const loggedInUserRole = sessionStorage.getItem(SESSION_KEY_ROLE);
    if (loggedInUserRole !== 'owner') {
        window.location.href = 'index.html';
        return; // Stop script execution
    }

    // Logout
    logoutButton.addEventListener('click', () => {
        sessionStorage.removeItem(SESSION_KEY_ROLE);
        window.location.href = 'index.html';
    });

    const IDR = n => 'Rp. ' + new Intl.NumberFormat('id-ID').format(Math.max(0, Math.round(n || 0)));

    let allTransactions = [];

    function renderTransactions(transactions) {
        transactionsBody.innerHTML = ''; // Clear existing rows

        if (transactions.length === 0) {
            transactionsBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Tidak ada transaksi ditemukan.</td></tr>';
            return;
        }

        transactions.forEach(tx => {
            const tr = document.createElement('tr');
            tr.dataset.id = tx._id; // Set row id for easy removal
            const timestamp = new Date(tx.serverTimestamp).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' });
            
            let detailHtml = '';
            let total = 0;

            if (tx.type === 'simple_transaction') {
                detailHtml = `<b>${tx['Nama Transaksi']}</b><br>${tx.Barang || '-'}`;
                total = tx.Harga;
            } else if (tx.type === 'detailed_transaction') {
                detailHtml = `<b>Nota untuk: ${tx.Tuan || 'N/A'}</b><br>`;
                tx.Detail.forEach(item => {
                    detailHtml += `• ${item['Qty']}x ${item['jenis pesanan']} @ ${IDR(item['harga satuan'])}<br>`;
                });
                total = tx.Total;
            }

            tr.innerHTML = `
                <td data-label="Timestamp">${timestamp}</td>
                <td data-label="Tipe">${tx.type === 'simple_transaction' ? 'Cepat' : 'Nota Pesanan'}</td>
                <td data-label="Detail"><div class="detail-block">${detailHtml}</div></td>
                <td data-label="Total">${IDR(total)}</td>
                <td data-label="Admin">${tx.Admin || 'N/A'}</td>
                <td data-label="Aksi">
                    <button class="btn-delete" data-id="${tx._id}">Hapus</button>
                </td>
            `;
            transactionsBody.appendChild(tr);
        });
    }

    async function deleteTransaction(id) {
        try {
            const response = await fetch(`${API_URL}/api/transactions/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) {
                throw new Error('Gagal menghapus transaksi');
            }
            // Remove the row from the table
            const row = transactionsBody.querySelector(`tr[data-id="${id}"]`);
            if (row) {
                row.remove();
            }
            // Also remove from the main data array
            allTransactions = allTransactions.filter(tx => tx._id !== id);

        } catch (error) {
            console.error('Error deleting transaction:', error);
            alert(error.message);
        }
    }

    transactionsBody.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-delete')) {
            const id = e.target.dataset.id;
            if (confirm('Anda yakin ingin menghapus nota ini secara permanen?')) {
                deleteTransaction(id);
            }
        }
    });

    async function fetchTransactions() {
        try {
            const response = await fetch(`${API_URL}/api/transactions`);
            if (!response.ok) {
                throw new Error(`Gagal mengambil data: ${response.statusText}`);
            }
            allTransactions = await response.json();
            renderTransactions(allTransactions);
        } catch (error) {
            console.error('Error fetching transactions:', error);
            transactionsBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: var(--danger);">Gagal memuat data. Pastikan server berjalan.</td></tr>';
        }
    }

    filterButton.addEventListener('click', () => {
        let filtered = allTransactions;

        const date = filterDate.value;
        if (date) {
            filtered = filtered.filter(tx => {
                const txDate = new Date(tx.serverTimestamp).toISOString().slice(0, 10);
                return txDate === date;
            });
        }

        const type = filterType.value;
        if (type) {
            filtered = filtered.filter(tx => tx.type === type);
        }

        renderTransactions(filtered);
    });

    // Initial fetch
    fetchTransactions();
});