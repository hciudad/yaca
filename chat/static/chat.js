; (function (chat, $) {
    let ws;

    chat.send_message = (event) => {
        event.preventDefault();
        var $message = $(event.currentTarget).find("input");
        ws.send($message.val());
        $message.val("");
    };

    return () => {
        console.info("Initializing chat.js")

        ws = new WebSocket("ws://localhost:8000/messages");
        ws.onmessage = function (event) {
            let $message_list = $("#message-list"),
                $message = $("<li>");
            $message.html(`<span style="color: #f00">${event.data}</span>`);
            $message.appendTo($message_list);
        };

        $("form").submit(chat.send_message);
    }
})(window.chat = window.chat || {}, jQuery)();
