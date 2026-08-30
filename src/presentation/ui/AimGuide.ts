import Phaser from 'phaser';

export interface AimObstacle {
  x: number;
  y: number;
  radius: number;
}

export class AimGuide {
  private dotPool: Phaser.GameObjects.Image[] = [];
  private bounceMarker: Phaser.GameObjects.Image;
  private isVisible = false;

  constructor(scene: Phaser.Scene) {

    // Create a pool of 40 dot sprites for smooth trajectory rendering
    for (let i = 0; i < 40; i++) {
      const dot = scene.add.image(0, 0, 'aim_dot');
      dot.setDepth(15);
      dot.setVisible(false);
      this.dotPool.push(dot);
    }

    this.bounceMarker = scene.add.image(0, 0, 'aim_bounce');
    this.bounceMarker.setDepth(16);
    this.bounceMarker.setVisible(false);
  }

  public updateTrajectory(
    startX: number,
    startY: number,
    angle: number,
    leftWall: number,
    rightWall: number,
    ceilingY: number,
    bubbleRadius: number,
    obstacles: AimObstacle[]
  ): void {
    // Hide all initially
    for (const dot of this.dotPool) {
      dot.setVisible(false);
    }
    this.bounceMarker.setVisible(false);

    // Only allow upward angles (e.g. between -10 deg and -170 deg)
    const normalizedAngle = Phaser.Math.Angle.Normalize(angle);
    const deg = Phaser.Math.RadToDeg(normalizedAngle);
    if (deg < 190 || deg > 350) {
      this.isVisible = false;
      return;
    }

    this.isVisible = true;

    let currentX = startX;
    let currentY = startY;
    let dirX = Math.cos(angle);
    let dirY = Math.sin(angle);

    const stepSize = 18;
    const maxSteps = 40;
    let step = 0;
    let bounced = false;

    const minX = leftWall + bubbleRadius;
    const maxX = rightWall - bubbleRadius;
    const minY = ceilingY + bubbleRadius;

    while (step < maxSteps) {
      const nextX = currentX + dirX * stepSize;
      const nextY = currentY + dirY * stepSize;

      // Check wall bounce
      if (nextX <= minX) {
        currentX = minX;
        dirX = -dirX; // Reflect X
        if (!bounced) {
          this.bounceMarker.setPosition(currentX, currentY);
          this.bounceMarker.setVisible(true);
          bounced = true;
        }
      } else if (nextX >= maxX) {
        currentX = maxX;
        dirX = -dirX; // Reflect X
        if (!bounced) {
          this.bounceMarker.setPosition(currentX, currentY);
          this.bounceMarker.setVisible(true);
          bounced = true;
        }
      } else {
        currentX = nextX;
      }

      currentY = nextY;

      // Place dot from pool
      const dot = this.dotPool[step];
      if (dot) {
        dot.setPosition(currentX, currentY);
        // Subtle pulse scale along the line
        const scaleFactor = 0.8 + 0.2 * Math.sin(step * 0.3);
        dot.setScale(scaleFactor);
        dot.setVisible(true);
      }

      // Check ceiling collision
      if (currentY <= minY) {
        break;
      }

      // Check obstacle (grid bubbles) collision
      let hitObstacle = false;
      for (const obs of obstacles) {
        const dx = currentX - obs.x;
        const dy = currentY - obs.y;
        const distSq = dx * dx + dy * dy;
        const collisionThreshold = bubbleRadius + obs.radius - 2;

        if (distSq <= collisionThreshold * collisionThreshold) {
          hitObstacle = true;
          break;
        }
      }

      if (hitObstacle) {
        break;
      }

      step++;
    }
  }

  public hide(): void {
    this.isVisible = false;
    for (const dot of this.dotPool) {
      dot.setVisible(false);
    }
    this.bounceMarker.setVisible(false);
  }

  public getIsVisible(): boolean {
    return this.isVisible;
  }
}
