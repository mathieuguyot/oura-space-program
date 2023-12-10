export default class InputManager {
    pressedKeys: { [key: string]: boolean } = {};
    constructor() {
        document.addEventListener("keydown", (event) => {
            this.pressedKeys[event.key] = true;
        });
        document.addEventListener("keyup", (event) => {
            this.pressedKeys[event.key] = false;
        });
    }

    IsKeyPressed(key: string) {
        return this.pressedKeys[key];
    }
}
