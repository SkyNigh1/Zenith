THREE.ShaderChunk['lerp_pos_pars_vertex'] = [
'uniform float stepProgress;',
'attribute vec3 positionPrev;',
].join('\n');
THREE.ShaderChunk['lerp_pos_vertex'] = [
'vec4 mvPosition = modelViewMatrix * vec4(mix(positionPrev, position, stepProgress), 1.0);',
'gl_Position = projectionMatrix * mvPosition;',
].join('\n');