import { rocket } from "datastar";

const styles = /* css */ `
.sb-draggable-container {
    border: 1px solid black;
    width: fit-content;
    height: fit-content;
}
.sb-draggable-trigger {
    cursor: pointer;
}
`;

rocket("sb-draggable-root", {
    props: ({ string }) => ({}),
    setup: ({ $$, action, emit }) => {
        action("grab", () => {});
    },
    render: ({ html, props: {} }) => html`
        <div>
            <slot></slot>
        </div>
    `,
});

rocket("sb-draggable-container", {
    setup: ({ $$, action, effect, adoptStyles, host, emit }) => {
        $$.dragging = false;
        $$.originalX = 0;
        $$.originalY = 0;
        $$.offsetX = 0;
        $$.offsetY = 0;
        $$.translate = "0px 0px";
        action("grabbed", (_, { x, y }) => {
            $$.dragging = true;
            $$.originalX = x;
            $$.originalY = y;
            console.log("grabbed", $$.originalX, $$.originalY);
        });
        action("released", () => {
            $$.dragging = false;
            $$.offsetX = 0;
            $$.offsetY = 0;
            console.log("released");
        });
        action("mousemove", (_, { x, y }) => {
            if ($$.dragging) {
                $$.offsetX = x - $$.originalX;
                $$.offsetY = y - $$.originalY;
                emit("dragged", {id: host.id, x: x, y: y})
            }
        });
        action("dragged", (_, { id, x, y }) => {
            if (host.id !== id) {
                console.log("dragged", id, x, y)
            }
        })
        effect(() => {
            $$.translate = `${$$.offsetX}px ${$$.offsetY}px`;
        });
        adoptStyles(host, styles)
    },
    render: ({ html, props: {} }) => html`
        <div
            class="sb-draggable-container"
            data-on:grabbed="@grabbed(evt.detail)"
            data-on:released="@released()"
            data-on:mousemove__window="@mousemove({x: evt.clientX, y: evt.clientY})"
            data-on:dragged__window="@dragged(evt.detail)"
            data-style:translate="$$translate"
        >
            <slot></slot>
        </div>
    `,
});

rocket("sb-draggable-trigger", {
    setup: ({ $$, action, emit, host, adoptStyles }) => {
        $$.grabbed = false;
        action("mousedown", ({ evt }, { x, y }) => {
            evt.preventDefault();
            $$.grabbed = true;
            emit("grabbed", { x: x, y: y });
        });
        action("mouseup", () => {
            if ($$.grabbed) {
                $$.grabbed = false;
                emit("released");
            }
        });
        adoptStyles(host, styles);
    },
    render: ({ html, props: {} }) => html`
        <div
            class="sb-draggable-trigger"
            data-on:mousedown="@mousedown({x: evt.clientX, y: evt.clientY})"
            data-on:mouseup__window="@mouseup()"
        >
            <slot></slot>
        </div>
    `,
});
