import React from 'react';
import { useApp } from '../contexts/AppContext';

// ── Business Switcher ─────────────────────────────────────────
export default function BusinessSwitcher({ bizList, current, onSwitch, onNew, onRefresh }) {
  return (
    <div className="biz-panel">
      <div className="biz-panel-list">
        {bizList.map(b => (
          <button key={b.id} className={`biz-panel-item ${current?.id === b.id ? 'active' : ''}`} onClick={() => onSwitch(b)}>
            <div className="biz-avatar" style={{ background: b.id % 3 === 0 ? 'var(--accent)' : b.id % 2 === 0 ? 'var(--secondary)' : 'var(--primary)' }}>{b.name[0].toUpperCase()}</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 600, fontSize: '.85rem' }}>{b.name}</div>
              <div style={{ fontSize: '.7rem', color: 'var(--text-secondary)' }}>{b.role}</div>
            </div>
            {current?.id === b.id && <i className="fa-solid fa-check" style={{ marginLeft: 'auto', color: 'var(--primary)', fontSize: '.8rem' }}></i>}
          </button>
        ))}
      </div>
      <div className="biz-panel-footer">
        <button className="btn btn-outline btn-sm btn-block" onClick={onNew}><i className="fa-solid fa-plus"></i> Nueva empresa</button>
      </div>
    </div>
  );
}

// ── Modal ─────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer, size = '' }) {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`modal ${size}`}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" onClick={onClose}><i className="fa-solid fa-xmark"></i></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ── Confirm Modal ─────────────────────────────────────────────
export function Confirm({ open, onClose, onConfirm, title, message, danger }) {
  return (
    <Modal open={open} onClose={onClose} title={title || 'Confirmar'} size="modal-sm"
      footer={<>
        <button className="btn btn-outline" onClick={onClose}>Cancelar</button>
        <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={() => { onConfirm(); onClose(); }}>{danger ? 'Eliminar' : 'Confirmar'}</button>
      </>}>
      <p style={{ color: 'var(--text-secondary)', lineHeight: 1.5 }}>{message}</p>
    </Modal>
  );
}

// ── Toast container ───────────────────────────────────────────
export function ToastContainer() {
  const { toasts } = useApp();
  return (
    <div className="toast-container">
      {toasts.map(t => (
        <div key={t.id} className={`toast ${t.type}`}>
          <i className={`fa-solid ${t.type === 'success' ? 'fa-check-circle' : t.type === 'error' ? 'fa-circle-xmark' : 'fa-circle-info'}`}></i>
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ── Empty state ───────────────────────────────────────────────
export function Empty({ icon = 'fa-box-open', title, desc, action }) {
  return (
    <div className="empty-state">
      <i className={`fa-solid ${icon}`}></i>
      <h3>{title}</h3>
      <p>{desc}</p>
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}

// ── Loading ───────────────────────────────────────────────────
export function Loading() {
  return <div className="loading-wrap"><div className="spinner"></div></div>;
}

// ── Stock badge ───────────────────────────────────────────────
export function StockBadge({ stock, minStock }) {
  if (stock === 0) return <span className="badge badge-danger">Sin Stock</span>;
  if (stock <= minStock) return <span className="badge badge-warning">Bajo Stock</span>;
  return <span className="badge badge-success">En Stock</span>;
}

// ── Role badge ────────────────────────────────────────────────
export function RoleBadge({ role }) {
  const map = { owner: 'badge-purple', admin: 'badge-info', moderator: 'badge-success', atc: 'badge-warning', viewer: 'badge-gray' };
  const labels = { owner: 'Dueño', admin: 'Admin', moderator: 'Moderador', atc: 'ATC', viewer: 'Visor' };
  return <span className={`badge ${map[role] || 'badge-gray'}`}>{labels[role] || role}</span>;
}

// ── Currency format ───────────────────────────────────────────
export function fmt(value, currency = 'USD') {
  return new Intl.NumberFormat('es-VE', { style: 'currency', currency, minimumFractionDigits: 2 }).format(value || 0);
}
export function fmtNum(n) {
  return new Intl.NumberFormat('es-VE').format(n || 0);
}
