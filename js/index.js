window.onload = () => {
  document.getElementById("start-button").onclick = () => {
    startGame();
  };

  function startGame() {
    document.getElementById("game-intro").style.display = "none";
    document.getElementById("game-board").style.display = "block";
    new Game().start();
  }
};
