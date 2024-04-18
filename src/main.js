//use 'npm run dev' to run the project

import { dialogueData, scaleFactor } from "./constants";
import {k} from "./kaboomCtx";
import { displayDialogue, setCamScale } from "./utils";

k.loadSprite("spritesheet", "./spritesheet.png", {
    sliceX: 39,
    sliceY: 31,
    anims: {
        "idle-down": 936,
        "walk-down": { from: 936, to: 939, loop: true, speed: 8 },
        "idle-side": 975,
        "walk-side": { from: 975, to: 978, loop: true, speed: 8 },
        "idle-up": 1014,
        "walk-up": { from: 1014, to: 1017, loop: true, speed: 8 },
    },
});

k.loadSprite("map", "./map.png");

k.setBackground(k.Color.fromHex("#311047"));

k.scene("main", async () => {
    const mapData = await (await fetch("./map.json")).json();
    const layers = mapData.layers; //layers in map.json

    const map = k.add([  //could've used 'make' here and then 'add' later to add map to canvas (like to the player object), but directly using 'add' is another way.
        k.sprite("map"),
        k.pos(0), //postion of object 'map' when it is displayed
        k.scale(scaleFactor)
    ]);

    const player = k.make([
        k.sprite("spritesheet", {anim: "idle-down"}), //optional default value of player
        k.area({
            shape: new k.Rect(k.vec2(0, 3), 10, 10), //create hitbox from origin to +3 on x axis with width & height of 10 each
        }),
        k.body(), //gives the object 'player' a physical body responding to physics
        k.anchor("center"), //specifies the origin of the coordinate system - default is top left
        k.pos(),
        k.scale(scaleFactor),
        { //custom properties
            speed: 250,
            direction: "down",
            isInDialogue: false, //to prevent player from doing anything when a dialogue is open
        },
        "player", //to give a tag to the object to identify it when e.g. it collides something, to write the relevant logic
    ]);

    for(const layer of layers){
        if(layer.name == "boundaries"){ //in map.json
            for(const boundary of layer.objects) {
                map.add([
                    k.area({
                        shape: new k.Rect(k.vec2(0), boundary.width, boundary.height),
                    }),
                    k.body({isStatic: true}), //avoid overlap of the object
                    k.pos(boundary.x, boundary.y),
                    boundary.name, //boundary.name will give the tag of the object as specified in the tiled app
                ]);

                if(boundary.name){
                    player.onCollide(boundary.name, () => {  //function to execute when player collides with the object with tag returned by boundary.name
                        player.isInDialogue = true;
                        
                        displayDialogue(dialogueData[boundary.name], () => (player.isInDialogue = false)); //display dialogue in case of a collision
                    });
                }
            }
            continue;
        }

        if(layer.name === "spawnpoints"){
            for(const entity of layer.objects){
                if(entity.name === "player"){
                    player.pos = k.vec2(
                        (map.pos.x + entity.x) * scaleFactor,
                        (map.pos.y + entity.y) * scaleFactor
                    );
                    k.add(player); //to add player object in the scene, it is a kaboom function
                    continue;
                }
            }
        }
    }

    //logic to scale camera to adjust to various screen size (defined in utils.js)
    /* for some reason below code makes the player object not move on mouse click down
    setCamScale(1);

    k.onResize(() => {
        setCamScale(k);
    })  //onResize is a kaboom builtin which tells if screen has been resized

    */

    k.onUpdate(() => {  //logic to make camera follow player, kaboom has camera object created by default
        k.camPos(player.pos.x, player.pos.y + 100);
    });

    k.onMouseDown((mouseBtn) => {
        if(mouseBtn !== "left" || player.isInDialogue) return;  //return if the button clicked is not left or if the player is in dialogue

        const worldMousePos = k.toWorld(k.mousePos());
        player.moveTo(worldMousePos, player.speed);  //first param is the target position, and the second is speed which we defined earlier in player object
        

        //logic to change player frames depending on the mouse angle and click direction
        const mouseAngle = player.pos.angle(worldMousePos);

        const lowerBound = 50;
        const upperBound = 125;

        //logic for up animation
        if(
            mouseAngle > lowerBound &&
            mouseAngle < upperBound &&
            player.curAnim() !== "walk-up"  //current animation
        ){
            player.play("walk-up");
            player.direction = "up";
            return;
        }

        //logic for down animation
        if(
            mouseAngle < -lowerBound &&
            mouseAngle > -upperBound &&
            player.curAnim() !== "walk-down"  //current animation
        ){
            player.play("walk-down");
            player.direction = "down";
            return;
        }

        //logic for right animation
        if(Math.abs(mouseAngle) > upperBound){
            player.flipX = false;
            if(player.curAnim() !== "walk-side") player.play("walk-side");  //by default the walk-side animation is right, hence we need to set flipX to 'true' in left case only
            player.direction = "right";
            return;
        }

        //logic for left animation
        if(Math.abs(mouseAngle) < lowerBound){
            player.flipX = true;
            if(player.curAnim() !== "walk-side") player.play("walk-side");
            player.direction = "left";
            return;
        }
    });

    //onMouseDown starts the animation but doesn't stop it even when the button is released, so onMouseRelease is necessary to write

    k.onMouseRelease(() => {
        if(player.direction === "down"){   //checks what was the direction of player at the instant the button was released
            player.play("idle-down");
            return;
        }
        if(player.direction === "up"){
            player.play("idle-up");
            return;
        }

        player.play("idle-side");  //if it was neither of up and down, player rests in side animation
        // although we flipped the direction when it was left, we don't need to write logic for both cases (left and right) seperately, they are handled automatically.
    });
});

k.go("main"); //default scene