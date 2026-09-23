import { rocket } from "datastar";

const styles = /* css */ `
.sb-draggable-container {
    border: 1px solid black;
    width: fit-content;
    height: fit-content;
    transition: box-shadow 0.3s ease;
}
.sb-draggable-container-targetted {
    box-shadow: 0 0 20px #0ff, 0 0 40px #0ff;
}
.sb-draggable-trigger {
    cursor: pointer;
}
`;

function isPointInElement(el, x, y) {
    const r = el.getBoundingClientRect();
    return x >= r.left && x <= r.right && y >= r.top && y <= r.bottom;
}

rocket("sb-draggable-container", {
    setup: ({ $$, action, effect, adoptStyles, host, emit }) => {
        $$.dragging = false;
        $$.targetted = false;
        $$.targetId = null;
        $$.originalX = 0;
        $$.originalY = 0;
        $$.offsetX = 0;
        $$.offsetY = 0;
        $$.translate = "0px 0px";
        action("grabbed", (_, { x, y }) => {
            $$.dragging = true;
            $$.originalX = x;
            $$.originalY = y;
            // console.log("grabbed", $$.originalX, $$.originalY);
        });
        action("released", ({ el }, { x, y }) => {
            $$.dragging = false;
            if ($$.targetId) {
                emit("swap", {id: host.id, target: $$.targetId})
            } else {
                $$.offsetX = 0;
                $$.offsetY = 0;
            }
            // console.log("released");
        });
        action("mousemove", ({ el }, { x, y }) => {
            if ($$.dragging) {
                $$.offsetX = x - $$.originalX;
                $$.offsetY = y - $$.originalY;
                emit("dragged", { id: el.id, x: x, y: y, released: false });
            }
        });
        action("dragged", ({ el }, { id, x, y, released }) => {
            if (el.id !== id && isPointInElement(el, x, y)) {
                // console.log("hover", el.id, x, y);
                if (released) {
                } else {
                    $$.targetted = true;
                    emit("targetted", {id: host.id})
                }
                return
            } else if ($$.targetted) {
                emit("targetted", {id: null})
            }
            $$.targetted = false;
        });
        action("targetted", (_, { id }) => {
            $$.targetId = id;
        })
        effect(() => {
            $$.translate = `${$$.offsetX}px ${$$.offsetY}px`;
        });
        adoptStyles(host, styles);
    },
    render: ({ html, host }) => html`
        <div
            id="sb-draggable-container-${host.id}"
            class="sb-draggable-container"
            part="container"
            data-on:grabbed="@grabbed(evt.detail)"
            data-on:released__viewtransition="@released(evt.detail)"
            data-on:mousemove__window="@mousemove({x: evt.clientX, y: evt.clientY})"
            data-on:dragged__window="@dragged(evt.detail)"
            data-on:targetted__window="@targetted(evt.detail)"
            data-style:translate="$$translate"
            data-class:sb-draggable-container-targetted="$$targetted"
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
        action("mouseup", (_, { x, y }) => {
            if ($$.grabbed) {
                $$.grabbed = false;
                emit("released", { x: x, y: y });
            }
        });
        adoptStyles(host, styles);
    },
    render: ({ html, props: {} }) => html`
        <div
            class="sb-draggable-trigger"
            data-on:mousedown="@mousedown({x: evt.clientX, y: evt.clientY})"
            data-on:mouseup__window="@mouseup({x: evt.clientX, y: evt.clientY})"
        >
            <slot></slot>
        </div>
    `,
});
