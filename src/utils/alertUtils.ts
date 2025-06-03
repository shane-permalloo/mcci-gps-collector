import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';

// Simple alert
export const showAlert = (title: string, message: string) => {
  confirmAlert({
    title: title,
    message: message,
    buttons: [
      {
        label: 'OK',
        onClick: () => {}
      }
    ]
  });
};

// Confirmation dialog with callback
export const showConfirm = (
  title: string, 
  message: string, 
  onConfirm: () => void, 
  onCancel?: () => void,
  confirmLabel: string = 'Yes',
  cancelLabel: string = 'No',
  isDelete: boolean = false
) => {
  confirmAlert({
    title: title,
    message: message,
    buttons: [
      {
        label: confirmLabel,
        className: isDelete ? 'delete-button' : '',
        onClick: onConfirm
      },
      {
        label: cancelLabel,
        className: 'cancel-button',
        onClick: () => onCancel?.()
      }
    ]
  });
};