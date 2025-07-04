declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

export const trackGtag = (
    action: string,
    category: string,
    label?: string,
    value?: number
) => {
    if (typeof window !== "undefined" && window.gtag) {
        window.gtag("event", action, {
        event_category: category,
        event_label: label ?? action,
        value,
        });
    }
};