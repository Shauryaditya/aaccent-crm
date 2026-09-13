import { useEffect, useRef } from 'react';

export default function AlertDialog({ title, children, confirmLabel = 'OK', cancelLabel = 'Cancel', onConfirm, onClose, busy = false, danger = false, error }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previousFocus = document.activeElement;
    dialog.showModal();
    cancelRef.current?.focus();
    return () => { dialog.close(); if (previousFocus?.isConnected) previousFocus.focus(); };
  }, []);
  return <dialog ref={dialogRef} role="alertdialog" aria-labelledby="alert-dialog-title" aria-describedby="alert-dialog-description" aria-busy={busy} className="app-alert-dialog" onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}>
    <h3 id="alert-dialog-title">{title}</h3>
    <div id="alert-dialog-description" className="alert-dialog-description">{children}</div>
    {error && <p role="alert" className="salary-error">{error}</p>}
    <div className="modal-actions">
      {onConfirm && <button ref={cancelRef} className="btn btn-secondary" disabled={busy} onClick={onClose}>{cancelLabel}</button>}
      <button className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} disabled={busy} onClick={onConfirm || onClose}>{busy ? 'Please wait…' : confirmLabel}</button>
    </div>
  </dialog>;
}
