import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TablePagination({ page, pageSize, pageCount, total, onPageChange, onPageSizeChange }) {
  const first = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const last = Math.min(page * pageSize, total);
  return <div className="table-pagination">
    <span className="pagination-count">Mostrando {first}–{last} de {total}</span>
    <label className="pagination-size">Filas por página
      <select aria-label="Filas por página" value={pageSize} onChange={(event) => onPageSizeChange(Number(event.target.value))}>
        {[3, 5, 10, 20].map((size) => <option value={size} key={size}>{size}</option>)}
      </select>
    </label>
    <span className="pagination-page">Página {page} de {Math.max(1, pageCount)}</span>
    <div className="pagination-buttons">
      <button type="button" className="icon-button" aria-label="Página anterior" disabled={page <= 1} onClick={() => onPageChange(page - 1)}><ChevronLeft size={16} /></button>
      <button type="button" className="icon-button" aria-label="Página siguiente" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}><ChevronRight size={16} /></button>
    </div>
  </div>;
}
