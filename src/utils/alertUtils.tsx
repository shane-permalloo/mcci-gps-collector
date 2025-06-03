import React from 'react';
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

// Confirmation dialog with HTML content
export const showHtmlConfirm = (
  title: string, 
  htmlMessage: string, 
  onConfirm: () => void, 
  onCancel?: () => void,
  confirmLabel: string = 'Yes',
  cancelLabel: string = 'No',
  isDelete: boolean = false
) => {
  confirmAlert({
    customUI: ({ onClose }) => {
      return React.createElement(
        'div',
        { className: 'react-confirm-alert-body' },
        React.createElement('h1', null, title),
        React.createElement('div', { 
          dangerouslySetInnerHTML: { __html: htmlMessage } 
        }),
        React.createElement(
          'div',
          { className: 'react-confirm-alert-button-group' },
          React.createElement(
            'button',
            { 
              className: isDelete ? 'delete-button' : '',
              onClick: () => {
                onConfirm();
                onClose();
              }
            },
            confirmLabel
          ),
          React.createElement(
            'button',
            {
              className: 'cancel-button',
              onClick: () => {
                if (onCancel) onCancel();
                onClose();
              }
            },
            cancelLabel
          )
        )
      );
    }
  });
};


