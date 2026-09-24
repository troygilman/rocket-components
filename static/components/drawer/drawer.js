import { rocket } from "datastar";

const styles = /* css */ `
`;

rocket("sb-drawer-container", {
    setup: ({ $$, action, effect, adoptStyles, host, emit }) => {
        adoptStyles(host, styles);
    },
    render: ({ html, host }) => html`
        <div
        >
            <slot></slot>
        </div>
    `,
});

rocket("sb-drawer-content", {
    setup: ({ $$, action, emit, host, adoptStyles }) => {
        adoptStyles(host, styles);
    },
    render: ({ html, props: {} }) => html`
        <div
        >
            <slot></slot>
        </div>
    `,
});
