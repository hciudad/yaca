; (function (chat, $) {
    const USER_STORAGE_KEY = "XwepdfIUYFD-chat-user";

    let ws;

    let _get_user = () => {
        let user = localStorage.getItem(USER_STORAGE_KEY);
        if (typeof user === "string") {
            return JSON.parse(user);
        }
    };

    let _set_user = () => {
        let username = prompt("What is your username?\n(THIS IS WILDLY INSECURE)"),
            display_name = prompt("What is your display name?\n(ALSO WILDLY INSECURE)"),
            user = {username: username, display_name: display_name};
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return user;
    };

    let _send_message = (event) => {
        event.preventDefault();
        let $message = $(event.currentTarget).find("input"),
            user = _get_user(),
            payload;

        if (!$message.val()) return;

        payload = {
            event_type: "message",
            username: user.username,
            display_name: user.display_name,
            message_text: $message.val(),
            timestamp: (new Date()).toUTCString()
        };

        ws.send(JSON.stringify(payload));
        $message.val("");
    };

    let _register_user = (user) => {
        payload = {
            event_type: "register_user",
            user: user,
            timestamp: (new Date()).toUTCString()
        };
        ws.send(JSON.stringify(payload));
    };

    let _message_tmpl = (message_text, display_name, timestamp) => `
        <div class="row border-bottom py-3">
            <div class="col">
                <h6>
                    ${display_name}
                    <small class="text-muted">${(new Date(timestamp)).toLocaleTimeString()}</small>
                </h6>
                <p class="lead">${message_text}</p>
            </div>
        </div>
    `;

    let _registered_tmpl = (display_name) => `
        <div class="row border-bottom py-3">
            <div class="col">
                <p class="lead text-muted small">${display_name} has joined the chat.</p>
            </div>
        </div>
    `;

    let _deregistered_tmpl = (display_name) => `
        <div class="row border-bottom py-3">
            <div class="col">
                <p class="lead text-muted small">${display_name} has left the chat.</p>
            </div>
        </div>
    `;

    return () => {
        console.info("Initializing chat.js")

        let user = _get_user() || _set_user();

        $("#greeting").text(`Me llamo ${user.display_name}!!`)

        ws = new WebSocket(`${(window.location.protocol === "https:") ? "wss" : "ws"}://${window.location.host}/messages`);
        ws.onmessage = event => {
            let $message_list = $("#message-list"),
                $participant_list = $("#nav-participants > .container"),
                event_obj = JSON.parse(event.data);
            

            if (event_obj.channel_membership) {
                $participant_list.empty();
                for (const participant of event_obj.channel_membership) {
                    $participant_list.append(
                        $(`<div class="row border-bottom p-3"><div class="col">${participant}</div></div>`)
                    );
                }
                $("#nav-participants-tab > span").text(event_obj.channel_membership.length);
            }
            
            if (event_obj.event_type === "message") {
                $message_list
                    .append($(_message_tmpl(event_obj.message_text, event_obj.display_name, event_obj.timestamp)));
            }
            else if (event_obj.event_type === "register_user") {
                $message_list
                    .append($(_registered_tmpl(event_obj.user.display_name)));
            }
            else if (event_obj.event_type === "deregister_user") {
                $message_list
                    .append($(_deregistered_tmpl(event_obj.user.display_name)));
            }
        };
        ws.onopen = event => {
            _register_user(user);
        };

        $("form").submit(_send_message);
    }
})(window.chat = window.chat || {}, jQuery)();
