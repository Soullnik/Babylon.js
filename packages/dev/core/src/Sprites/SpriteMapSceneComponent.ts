import { Observable } from "../Misc/observable";
import type { IReadonlyObservable } from "../Misc/observable";
import { Scene } from "../scene";
import type { ISceneComponent } from "../sceneComponent";
import { SceneComponentConstants } from "../sceneComponent";
import type { SpriteMap } from "./spriteMap";

// --- 1. Расширение Scene ---

declare module "../scene" {
    export interface Scene {
        /** All of the sprite maps added to this scene */
        spriteMaps: SpriteMap[];

        /** An event triggered when a sprite map is added to the scene */
        readonly onNewSpriteMapAddedObservable: IReadonlyObservable<SpriteMap>;

        /** An event triggered when a sprite map is removed from the scene */
        readonly onSpriteMapRemovedObservable: IReadonlyObservable<SpriteMap>;
    }
}

type InternalSpriteMapAugmentedScene = Scene & {
    _onNewSpriteMapAddedObservable?: Observable<SpriteMap>;
    _onSpriteMapRemovedObservable?: Observable<SpriteMap>;
};

// --- 2. Observable properties ---

Object.defineProperty(Scene.prototype, "onNewSpriteMapAddedObservable", {
    get: function (this: InternalSpriteMapAugmentedScene) {
        if (!this._onNewSpriteMapAddedObservable) {
            const observable = (this._onNewSpriteMapAddedObservable = new Observable<SpriteMap>());
            this.onDisposeObservable.addOnce(() => observable.clear());
        }
        return this._onNewSpriteMapAddedObservable;
    },
    enumerable: true,
    configurable: true,
});

Object.defineProperty(Scene.prototype, "onSpriteMapRemovedObservable", {
    get: function (this: InternalSpriteMapAugmentedScene) {
        if (!this._onSpriteMapRemovedObservable) {
            const observable = (this._onSpriteMapRemovedObservable = new Observable<SpriteMap>());
            this.onDisposeObservable.addOnce(() => observable.clear());
        }
        return this._onSpriteMapRemovedObservable;
    },
    enumerable: true,
    configurable: true,
});

// --- 3. SceneComponent ---

/**
 * Defines the sprite map scene component responsible to manage sprite maps
 * in a given scene.
 */
export class SpriteMapSceneComponent implements ISceneComponent {
    /** The component name to help identify it in the list of scene components */
    public readonly name = SceneComponentConstants.NAME_SPRITEMAP;

    /** The scene the component belongs to */
    public scene: Scene;

    constructor(scene: Scene) {
        this.scene = scene;

        // Ensure spriteMaps is initialized
        if (!this.scene.spriteMaps) {
            this.scene.spriteMaps = [];
        }
    }

    /** Registers the component in the scene */
    public register(): void {
        // Optional: Register any pointer events or rendering steps here
    }

    /** Rebuilds component-related resources (no-op here) */
    public rebuild(): void {}

    /** Disposes all sprite maps and clears observables */
    public dispose(): void {
        const spriteMaps = this.scene.spriteMaps;
        if (spriteMaps) {
            while (spriteMaps.length > 0) {
                const sm = spriteMaps.pop()!;
                sm.dispose();
                (this.scene as InternalSpriteMapAugmentedScene)._onSpriteMapRemovedObservable?.notifyObservers(sm);
            }
        }
    }
}
