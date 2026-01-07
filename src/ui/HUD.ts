export class HUD {
  private healthFill: HTMLElement
  private healthText: HTMLElement
  private waveNumber: HTMLElement
  private killsCount: HTMLElement
  private gameOverScreen: HTMLElement
  private finalWave: HTMLElement
  private finalKills: HTMLElement
  private finalTime: HTMLElement

  constructor() {
    this.healthFill = document.getElementById('health-fill')!
    this.healthText = document.getElementById('health-text')!
    this.waveNumber = document.getElementById('wave-number')!
    this.killsCount = document.getElementById('kills-count')!
    this.gameOverScreen = document.getElementById('game-over')!
    this.finalWave = document.getElementById('final-wave')!
    this.finalKills = document.getElementById('final-kills')!
    this.finalTime = document.getElementById('final-time')!
  }

  public updateHealth(current: number, max: number): void {
    const percent = (current / max) * 100
    this.healthFill.style.width = `${percent}%`
    this.healthText.textContent = `${Math.floor(current)} / ${max}`

    // Change color based on health
    if (percent < 25) {
      this.healthFill.style.background = 'linear-gradient(90deg, #ff0000, #ff2222)'
    } else if (percent < 50) {
      this.healthFill.style.background = 'linear-gradient(90deg, #ff4400, #ff6644)'
    } else {
      this.healthFill.style.background = 'linear-gradient(90deg, #00aa00, #22cc22)'
    }
  }

  public updateWave(wave: number): void {
    this.waveNumber.textContent = wave.toString()
  }

  public updateKills(kills: number): void {
    this.killsCount.textContent = kills.toString()
  }

  public showGameOver(wave: number, kills: number, timeSeconds: number): void {
    this.gameOverScreen.style.display = 'flex'
    this.finalWave.textContent = wave.toString()
    this.finalKills.textContent = kills.toString()

    const minutes = Math.floor(timeSeconds / 60)
    const seconds = Math.floor(timeSeconds % 60)
    this.finalTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`
  }
}
