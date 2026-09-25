import { rocket } from "datastar";

const containerStyles = /* css */ `
:host {
    display: block;
    --_size: var(--sb-drawer-size, 280px);
    --_duration: var(--sb-drawer-duration, 250ms);
}
.layout {
    display: flex;
    width: 100%;
    height: 100%;
    overflow: hidden;
}
:host([side="right"]) .layout {
    flex-direction: row-reverse;
}
:host([side="top"]) .layout {
    flex-direction: column;
}
:host([side="bottom"]) .layout {
    flex-direction: column-reverse;
}
.panel {
    flex: 0 0 0;
    display: flex;
    justify-content: flex-end;
    overflow: hidden;
    visibility: hidden;
    transition:
        flex-basis var(--_duration) ease,
        visibility var(--_duration);
}
:host([side="top"]) .panel,
:host([side="bottom"]) .panel {
    flex-direction: column;
}
:host([side="right"]) .panel,
:host([side="bottom"]) .panel {
    justify-content: flex-start;
}
.layout.open .panel {
    flex-basis: var(--_size);
    visibility: visible;
}
.panel-inner {
    flex: 0 0 var(--_size);
    overflow: auto;
}
.main {
    flex: 1 1 0;
    min-width: 0;
    min-height: 0;
    overflow: auto;
}
@media (prefers-reduced-motion: reduce) {
    .panel {
        transition: none;
    }
}
`;

const triggerStyles = /* css */ `
:host {
    display: inline-block;
}
button {
    all: unset;
    cursor: pointer;
}
button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
}
`;

rocket("sb-drawer-container", {
    props: ({ bool, oneOf }) => ({
        open: bool,
        side: oneOf("left", "right", "top", "bottom").default("left"),
    }),
    renderOnPropChange: false,
    setup: ({ $$, action, observeProps, adoptStyles, host, props, emit }) => {
        $$.open = props.open;
        action("toggle", ({ evt }, { action }) => {
            evt?.stopPropagation();
            if (action === "open") host.open = true;
            else if (action === "close") host.open = false;
            else host.open = !props.open;
        });
        observeProps(() => {
            $$.open = props.open;
            emit(props.open ? "sb-drawer-open" : "sb-drawer-close");
        }, "open");
        adoptStyles(host, containerStyles);
    },
    onFirstRender: ({ apply, host }) => {
        // Rocket doesn't apply Datastar to authored children of shadow-mode
        // hosts on connect, and the page content lives here.
        for (const child of host.children) apply(child);
    },
    render: ({ html }) => html`
        <div
            class="layout"
            part="layout"
            data-class:open="$$open"
            data-on:sb-drawer-toggle="@toggle(evt.detail)"
        >
            <div class="panel" part="panel">
                <div class="panel-inner">
                    <slot name="drawer"></slot>
                </div>
            </div>
            <div class="main" part="main">
                <slot></slot>
            </div>
        </div>
    `,
});

rocket("sb-drawer-trigger", {
    props: ({ oneOf }) => ({
        action: oneOf("toggle", "open", "close").default("toggle"),
    }),
    setup: ({ action, emit, host, props, adoptStyles }) => {
        action("click", () => {
            emit("sb-drawer-toggle", { action: props.action });
        });
        adoptStyles(host, triggerStyles);
    },
    render: ({ html }) => html`
        <button type="button" part="button" data-on:click="@click()">
            <slot></slot>
        </button>
    `,
});
