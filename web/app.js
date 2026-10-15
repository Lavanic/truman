// message formats live in backend/events.py

const socket = new WebSocket(`ws://${location.host}/ws`);

socket.onmessage = (msg) => {
  const event = JSON.parse(msg.data);

  switch (event.type) {
    case "transcript":
      // TODO: current line, move to history when event.final
      break;
    case "scores":
      // TODO: crowd mind bars (laugh, cheer, boo, ooh)
      break;
    case "reaction":
      // TODO: reaction pop-up
      break;
    case "status":
      // TODO: listening / mode / muted
      break;
  }
};

function setMode(mode) {
  socket.send(JSON.stringify({ type: "set_mode", mode }));
}

function setMuted(muted) {
  socket.send(JSON.stringify({ type: "mute", muted }));
}
