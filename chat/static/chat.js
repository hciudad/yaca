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

    return () => {
        console.info("Initializing chat.js")

        let user = _get_user() || _set_user();

        // alert(`Hello, ${user.display_name}!!!`);

        ws = new WebSocket("ws://localhost:8000/messages");
        ws.onmessage = function (event) {
            let $message_list = $("#message-list"),
                $message = $("<li>");
            $message.html(`<span style="color: #f00">${event.data}</span>`);
            $message.appendTo($message_list);
        };

        $("form").submit(_send_message);
    }
})(window.chat = window.chat || {}, jQuery)();
