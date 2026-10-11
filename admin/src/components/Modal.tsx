import { useEffect, useRef, useState } from 'react';
import { AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import './Modal.css';

export interface ConfirmModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  isOpen,
  title = '提示确认',
  message,
  confirmText = '确定',
  cancelText = '取消',
  variant = 'warning',
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className={`modal-icon modal-icon-${variant}`}>
              {variant === 'danger' && <AlertCircle size={20} />}
              {variant === 'warning' && <AlertTriangle size={20} />}
              {variant === 'info' && <Info size={20} />}
            </div>
            <h3 className="modal-title">{title}</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onCancel} aria-label="关闭">
            <X size={16} />
          </button>
        </div>

        <div className="modal-body">
          <p>{message}</p>
        </div>

        <div className="modal-footer">
          <button type="button" className="wc-btn wc-btn-secondary" onClick={onCancel}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`wc-btn ${variant === 'danger' ? 'wc-btn-danger' : 'wc-btn-primary'}`}
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export interface PromptModalProps {
  isOpen: boolean;
  title?: string;
  message: string;
  placeholder?: string;
  defaultValue?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: (val: string) => void;
  onCancel: () => void;
}

export function PromptModal({
  isOpen,
  title = '请输入',
  message,
  placeholder = '',
  defaultValue = '',
  confirmText = '确定',
  cancelText = '取消',
  onConfirm,
  onCancel,
}: PromptModalProps) {
  const [val, setVal] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setVal(defaultValue);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(val);
  };

  return (
    <div className="modal-backdrop" onClick={onCancel}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <form onSubmit={handleSubmit}>
          <div className="modal-header">
            <div className="modal-title-group">
              <div className="modal-icon modal-icon-info">
                <Info size={20} />
              </div>
              <h3 className="modal-title">{title}</h3>
            </div>
            <button type="button" className="modal-close-btn" onClick={onCancel} aria-label="关闭">
              <X size={16} />
            </button>
          </div>

          <div className="modal-body">
            <p>{message}</p>
            <input
              ref={inputRef}
              type="text"
              className="modal-input"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={placeholder}
            />
          </div>

          <div className="modal-footer">
            <button type="button" className="wc-btn wc-btn-secondary" onClick={onCancel}>
              {cancelText}
            </button>
            <button type="submit" className="wc-btn wc-btn-primary">
              {confirmText}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
