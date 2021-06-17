Easy3D - webGL
----------
Yet another JS 3D/game engine test

Trying out webGL, transfering most of my old Delphi and C# OpenGL game engine structure in webGL

Current project state is available for testing [here](https://m4nusky.com/projects/Easy3D_webGL/) (updated ~~every 24h~~ sometimes).

### /ver5
- [ver5demo1.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo1.html) basic test page, skeleton html, auto-setup
- [ver5demo2.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo2.html) test page with dedicated target div, auto-setup
- [ver5demo3.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo3.html) demo for full screen and pointer lock
- [ver5demo4.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo4.html) primitive mesh generation with random parameters
- [ver5demo5.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo5.html) various basic GLSL shaders demo
### current WIP
- [ver5demo6.html](https://m4nusky.com/projects/Easy3D_webGL/ver5demo6.html) animator demo (Direct, Transform, Physics, Particules)

### /ver4: 
- [ver4.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4.hmtl): Works with mouse/keyboard in desktop browser, touch controls for mobile.
- [ver4cellshader.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4cellshader.html): toon/cell shading render demo
- [ver4fullscreen.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4fullscreen.html): pointer lock, full screen demo
- [ver4stl.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4stl.html): binary STL loader/viewer app 
- [ver4physic.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4physic.html): Collisiton Detection and Physics demo
- [ver4maze.html](https://m4nusky.com/projects/Easy3D_webGL/ver4/ver4maze.html): Ball in Maze game, game loop and logic, pseudo-random maze generator.

### Random project that uses the testing framework and game loop 
- [Memory.html](https://m4nusky.com/Memory/Memory.html): Remake of the classic "Simon" memory game. With color position shuffle!

### Folders 
- /Electron: content specific for Electron app (STL viewer, like MS Photo or Image Viewer but for 3D stl files)
- /Images: icons / sprites / images resources
- /Models: Mesh and object data
- /Tests: 
    - [performance test](https://m4nusky.com/projects/Easy3D_webGL/tests/test1.html) for JS
    - [JS gl-matrix vs WebGL sahders](https://m4nusky.com/projects/Easy3D_webGL/tests/testMat.html)
    - [WebGL](https://m4nusky.com/projects/Easy3D_webGL/Tests/testMatShader.html)
    - [CSS fullscreen flex layout](https://m4nusky.com/projects/Easy3D_webGL/Tests/testLayout3.html)
    - [Oklab Color Space](https://m4nusky.com/projects/Easy3D_webGL/Tests/testColors.html)
- /ver0: WebGL [tutorial](https://m4nusky.com/projects/Easy3D_webGL/ver0/tuto1.html) transcript and tests, controls abstraction and [demo](https://m4nusky.com/projects/Easy3D_webGL/ver0/tuto2.html)
- /[ver3](https://m4nusky.com/projects/Easy3D_webGL/ver3/ver3.html): basic engine contorls, model loading

Current work-in-progress and next steps
----------
### --ver5:
- flatten engine to reduce nested calls and object hierarchy walking
- extract all "DEV" stuff to a debug class
- loader for all the required scripts
    - script list
    - data-main and data-fail tag in html page
    - fallback on error
- collision detection and physics
    - fix jitter due to gravity
    - Static-vs-Dynamic tests
    - culling
    - test progressive approximation instead of interpolation
    - Basic Physics (bounce, slide, stick) as body data attached to entity
    - Improved Physics (mass, moment of rotation etc)
- textures
    - convert all mesh, loader, generators, to convert colors to LUT-colors
    - convert all shader and scenes to LUT colors and textures
- Regroup vertexArrays for mesh data in an interleaved array
    - in scene renderer
    - in entity
    - in loader
- Sprites (always facing viewer, shader with minimal inputs)
- Text render in 3D scene
    - in world as entity
    - world-to-viewport as sprite
- Evaluate value of render culling on mobile
    - Z position
    - frustum

### --ver6
- Other type of physics mechanic for controls. (chase camera/3rd person with spring and hit test)
- Improved Collision Detection with dual Interpolation (point, edge, sphere, plane, box, triangles)
- Evaluate quaternions
- Animations
    - Transform animations with state list and transitions (linear, sharp, dull)
    - Path interpolation animator for bots and animations
- Better lights shaders (array of different types of ligts) (spot, point etc)
- UI / HUD
- NetCode
- Improved Entity loading
    - external tool should prepare model data for better load perf
    - tool to generate solid body data
    - tool to remove duplicate solid body data, edges in creases
    - STL, OBJ, MS3D to JSON or other ready-to-use format for mesh data and entities
- Sounds
- Some kind of game:
    - Tetris ?
    - 3D Asteroid ?
    - 3D bullet hell ?
    - space war ?
    - dogfighter ?
    - horde/tower defence ?

### --ver7:
- Basic AI
    - ScripterSequence (source engine style)
    - Pathfinding
- 3D cube tree or AABB Collision target culling
- CD bodies nesting
    - single for simpl
    - array of for complex
    - interaction modes between bodies
- Entity hierarchy
    - parents with n-childs
    - matrix propagation
- Mesh hierarchy
    - vertex bind node
    - vertex weight
    - keyframe anim and interpolation
- shaders
    - update to leverage GPU matrix multiplication efficiency instead of JS engine
    - test render to texture in multiple passes for 1 final light pass (Nanite style!) 

Overview of collistion detection possibilities and implementation difficulty
-----------

| Entity Type   | Vertor  | Sphere | Plane | Cube | Traingle Mesh |
|:------------- |:-------:|:------:|:-----:|:----:|:-------------:|
| Vector        | useless |  Easy  | Easy  |  ok  |  hmm |
| Sphere        |         |  Easy  |  ok   |  hmm | nope |
| Plane         |         |        |  useless | wtf | nope |
| Cube          |         |        |       | not easy | nope |
| Triangle Mesh |         |        |       |       | NOPE |

Evaluations of CD and physics
-----------
* [old] Eager: test and adjust all CD for each collisions, single pass
* Shortest: test and keep only shortest hit of each source
* Average: test and note all collisions, result is average of all adjustments
* Incremental: test (eager) multiple time along path of CD solids instead of shape interpolation
* [Current] Shortest multi-pass: test all then adjust for shortest hit, mark as done, re-test for next hits n-times or until no more hits
* Progressive: Find shortest collision time, adjust all for time, recalc next pass until time reach 1 or maximum passes

Interpolations
-----------
* Point : vector
* Edge : plane
* Sphere : capsule
* Plane : box
* Box : box

-M4nuski
