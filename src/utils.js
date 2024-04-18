//use 'npm run dev' to run the project

export function displayDialogue(text, onDisplayEnd){
    const dialogueUI = document.getElementById("textbox-container");
    const dialogue = document.getElementById("dialogue");

    dialogueUI.style.display = "block";

    //implement text scrolling, quite easy in js
    let index = 0;
    let currentText = "";
    const intervalRef = setInterval(() => {
        if(index < text.length){
            currentText += text[index];
            dialogue.innerHTML = currentText; //cannot use innerText because then links will not be clickable.
            index++;
            return;
        }

        clearInterval(intervalRef);
    }, 5);

    const closeBtn = document.getElementById("close");

    function onCloseBtnClick(){
        onDisplayEnd();
        dialogueUI.style.display = "none";
        dialogue.innerHTML = "";
        clearInterval(intervalRef);
        closeBtn.removeEventListener("click", onCloseBtnClick);
    }

    closeBtn.addEventListener("click", onCloseBtnClick);
}


//logic to scale camera to adjust to various screen size (used in main.js)
export function setCamScale(k){
    const resizeFactor = k.width()/k.height();  //width and height of 'canvas'
    if(resizeFactor<1){
        k.camScale(k.vec2(1));
        return;
    }

    //else
    k.camScale(k.vec2(1.5));
}