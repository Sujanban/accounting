import { Cross2Icon, ExclamationTriangleIcon } from "@radix-ui/react-icons";
import { useSyncExternalStore } from "react";
import { dismissToast, getToasts, subscribeToToasts } from "../lib/toast";

export function ToastRegion() {
  const messages = useSyncExternalStore(subscribeToToasts, getToasts, getToasts);

  return (
    <div className="app-toast-region" aria-live="assertive" aria-label="Notifications">
      {messages.map((toast) => (
        <div className="app-toast app-toast--error" role="alert" key={toast.id}>
          <ExclamationTriangleIcon className="app-toast__icon" aria-hidden="true" />
          <div className="app-toast__content">
            <strong className="app-toast__title">{toast.title}</strong>
            <p className="app-toast__message">{toast.message}</p>
            {toast.details.length ? (
              <ul className="app-toast__details">
                {toast.details.map((detail, index) => <li key={`${toast.id}-${index}`}>{detail}</li>)}
              </ul>
            ) : null}
            {toast.metadata ? <span className="app-toast__metadata">{toast.metadata}</span> : null}
          </div>
          <button className="app-toast__close" type="button" onClick={() => dismissToast(toast.id)} aria-label="Dismiss notification">
            <Cross2Icon aria-hidden="true" />
          </button>
        </div>
      ))}
    </div>
  );
}
