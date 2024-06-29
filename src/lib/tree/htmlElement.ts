type HTMLElementEvent<T extends HTMLElement> = Event & {
    target: T;
};

type HTMLElementMouseEvent<T extends HTMLElement> = MouseEvent & {
    target: T;
};

type ExtraBtn<T extends HTMLElement> = HTMLElement & {
    // button: number;
    target?: T;
    setIcon?: (icon: string) => void;
};

export type {
    HTMLElementEvent,
    HTMLElementMouseEvent,
    ExtraBtn
};