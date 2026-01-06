this["App"] = this["App"] || {};
this["App"]["shaders"] = this["App"]["shaders"] || {};

this["App"]["shaders"]["alpha-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return "uniform vec3 diffuse;\nuniform float opacity;\nvarying float vAlpha;\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  vec3 outgoingLight = vec3(0.0);\n  vec4 diffuseColor = vec4(diffuse, opacity * vAlpha);\n  vec3 totalAmbientLight = vec3(1.0); // hardwired\n  vec3 shadowMask = vec3(1.0);\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.alphatest_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  outgoingLight = diffuseColor.rgb * totalAmbientLight;\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.linear_to_gamma_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  gl_FragColor = vec4(outgoingLight, diffuseColor.a);\n}\n";
},"useData":true});

this["App"]["shaders"]["alpha-vert"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\nattribute float alpha;\nvarying float vAlpha;\n\nvoid main() {\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.begin_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.project_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.worldpos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  vAlpha = alpha;\n}\n";
},"useData":true});

this["App"]["shaders"]["basic-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return "uniform vec3 diffuse;\nuniform float opacity;\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv2_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.alphamap_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.aomap_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.envmap_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.fog_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.shadowmap_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.specularmap_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  vec3 outgoingLight = vec3(0.0);\n  vec4 diffuseColor = vec4(diffuse, opacity);\n  vec3 totalAmbientLight = vec3(1.0);\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.alphamap_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.alphatest_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.specularmap_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.aomap_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  outgoingLight = diffuseColor.rgb * totalAmbientLight;\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.envmap_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.shadowmap_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.linear_to_gamma_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.fog_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  gl_FragColor = vec4(outgoingLight, diffuseColor.a);\n}\n";
},"useData":true});

this["App"]["shaders"]["basic-point-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return "uniform vec3 psColor;\nuniform float opacity;\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_particle_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.fog_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.shadowmap_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  vec3 outgoingLight = vec3(0.0);\n  vec4 diffuseColor = vec4(psColor, opacity);\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_particle_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.alphatest_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  outgoingLight = diffuseColor.rgb;\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.shadowmap_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.fog_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  gl_FragColor = vec4(outgoingLight, diffuseColor.a);\n}\n";
},"useData":true});

this["App"]["shaders"]["basic-vert"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv2_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.envmap_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.morphtarget_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.skinning_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.shadowmap_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv2_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.skinbase_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  #ifdef USE_ENVMAP\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.beginnormal_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.morphnormal_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.skinnormal_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.defaultnormal_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  #endif\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.begin_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.morphtarget_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.skinning_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.project_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.worldpos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.envmap_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.shadowmap_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n}\n";
},"useData":true});

this["App"]["shaders"]["bulb-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "uniform vec3 diffuse;\nuniform vec3 diffuseB;\nuniform float opacity;\nuniform float time;\nvarying vec2 vUv;\nvarying vec3 vNormal;\n\nconst vec3 eye = vec3(0.0, 0.0, 1.0);\n\nfloat oscillate(float vMin, float vMax, float t) {\n  float halfRange = (vMax - vMin) / vMax * 0.5;\n  return (sin(t) * halfRange + (1.0 - halfRange)) * vMax;\n}\n\nfloat accumulate(vec2 uv, float saturation, float scale) {\n  saturation -= sin(uv.x * 60.0) * 0.25 + sin(uv.x * 50.0 * scale) * 0.25 + 0.75;\n\n  saturation -= sin(uv.y * sin(uv.x         * 5.0) * 5.0 * scale) * 0.05;\n  saturation -= sin(uv.y * sin((1.0 - uv.x) * 5.0) * 5.0 * scale) * 0.05;\n\n  saturation -= sin(uv.y * sin(uv.y + cos(uv.x)       * 2.0) * 3.0 * scale) * 0.15;\n  saturation -= sin(uv.y * sin(uv.y + cos(1.0 - uv.x) * 2.0) * 3.0 * scale) * 0.15;\n\n  saturation -= sin((uv.y - 1.5) * sin(uv.y + cos(uv.x - 1.0) * 2.0) * 4.0 * scale) * 0.15;\n  saturation -= sin((uv.y - 1.5) * sin(uv.y + cos(uv.x)       * 2.0) * 3.0 * scale) * 0.15;\n\n  saturation -= sin(uv.y * 5.0) * 0.15 + sin(uv.y * 2.5) * 1.25;\n\n  return saturation;\n}\n\nvoid main() {\n  vec3 normal = normalize(mat3(viewMatrix) * vNormal);\n  float rim = 1.0 - max(dot(eye, normal), 0.0);\n  float saturation = 0.0;\n\n  vec2 uv0 = vUv;\n  vec2 uv1 = uv0 + rim;\n  vec2 uv2 = vec2(-rim * 0.25);\n  vec2 uv3 = vec2(rim, uv0.y);\n\n  float scale0 = oscillate( 8.0, 15.0, time * 0.25 + 0.5);\n  float scale1 = oscillate(12.0, 20.0, time * 0.125);\n  float scale2 = 1.0;\n  float scale3 = 1.0;\n\n  saturation += max(accumulate(uv0, 2.0, scale0), -0.5);\n  saturation += max(accumulate(uv1, 2.0, scale1),  0.25);\n  saturation += max(accumulate(uv2, 1.0, scale2), -0.25);\n  saturation += max(accumulate(uv3, 1.0, scale3), -0.25);\n\n  gl_FragColor = vec4(\n    mix(diffuse, diffuseB, smoothstep(-0.5, 0.5, saturation)),\n    (1.0 - smoothstep(-0.5, 2.5, saturation)) * opacity);\n}\n";
},"useData":true});

this["App"]["shaders"]["dust-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return "uniform vec3 psColor;\nuniform float opacity;\nuniform float area;\nvarying float centerDist;\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_particle_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  vec4 diffuseColor = vec4(psColor, opacity);\n  float radius = area * 0.5;\n  float illumination = max(0.0, (radius - centerDist) / radius);\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_particle_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  gl_FragColor = vec4(diffuseColor.rgb,\n    illumination * illumination * diffuseColor.a);\n}\n";
},"useData":true});

this["App"]["shaders"]["dust-vert"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "uniform float size;\nuniform float scale;\nuniform float time;\nuniform float area;\nvarying float centerDist;\n\nvoid main() {\n  float offsetY = mod(position.y - 1.0 * time, area) - area * 0.5;\n  vec3 offsetPosition = vec3(\n    position.x + sin(cos(offsetY * 0.1) + sin(offsetY * 0.1 + position.x * 0.1) * 2.0),\n    offsetY,\n    position.z + sin(cos(offsetY * 0.1) + sin(offsetY * 0.1 + position.z * 0.1) * 2.0));\n\n  centerDist = length(offsetPosition);\n\n  vec4 mvPosition = modelViewMatrix * vec4(offsetPosition, 1.0);\n\n  gl_PointSize = size * (scale / length(mvPosition.xyz));\n  gl_Position = projectionMatrix * mvPosition;\n}\n";
},"useData":true});

this["App"]["shaders"]["gel-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "uniform vec3 diffuse;\nuniform float opacity;\nvarying vec3 vNormal;\n\nvoid main() {\n  vec3 eye = vec3(0.0, 0.0, 1.0);\n  vec3 normal = normalize(mat3(viewMatrix) * vNormal);\n  float rim = 1.0 - max(dot(eye, normal), 0.0);\n\n  float rimLight = 0.25 +\n    smoothstep(0.25, 1.0, rim) * 0.5 +\n    smoothstep(0.90, 1.0, rim) * 0.8;\n\n  gl_FragColor.rgb = diffuse * vec3(rimLight);\n  gl_FragColor.a = opacity;\n}\n";
},"useData":true});

this["App"]["shaders"]["gel-vert"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvarying vec3 vNormal;\n\nvoid main() {\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.worldpos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  vNormal = normalize(position);\n}\n";
},"useData":true});

this["App"]["shaders"]["lerp-point-vert"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return "uniform float size;\nuniform float scale;\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  #ifdef USE_SIZEATTENUATION\n    gl_PointSize = size * (scale / length(mvPosition.xyz));\n  #else\n    gl_PointSize = size;\n  #endif\n}\n";
},"useData":true});

this["App"]["shaders"]["lerp-vert"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv2_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv2_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.begin_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.worldpos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n}\n";
},"useData":true});

this["App"]["shaders"]["normal-vert"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv2_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvarying vec3 vNormal;\n\nvoid main() {\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.uv2_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.begin_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.logdepthbuf_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.worldpos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  vNormal = normalize(position);\n}\n";
},"useData":true});

this["App"]["shaders"]["tail-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "uniform vec3 diffuse;\nuniform vec3 diffuseB;\nuniform float opacity;\nuniform float scale;\nvarying vec2 vUv;\nvarying vec3 vNormal;\n\nconst vec3 eye = vec3(0.0, 0.0, 1.0);\n\nfloat accumulate(vec2 uv, float saturation, float scale) {\n  saturation -= sin(uv.y * 12.0 * scale) * 0.8 + uv.y * 1.5 + sin(uv.x * 20.0 * scale) * 0.1 + 0.85;\n\n  saturation -= sin(uv.y * sin(uv.x         * 5.0) * 5.0 * scale) * 0.05;\n  saturation -= sin(uv.y * sin((1.0 - uv.x) * 5.0) * 5.0 * scale) * 0.05;\n\n  saturation -= sin(uv.y * sin(uv.y + cos(uv.x)       * 2.0) * 10.0 * scale) * 0.15;\n  saturation -= sin(uv.y * sin(uv.y + cos(1.0 - uv.x) * 2.0) * 10.0 * scale) * 0.15;\n\n  return saturation;\n}\n\nvoid main() {\n  vec2 uv = vUv;\n  vec3 normal = normalize(mat3(viewMatrix) * vNormal);\n  float rim = 1.0 - max(dot(eye, normal), 0.0);\n  float saturation = 0.0;\n\n  saturation += accumulate(uv, 2.0, scale);\n  saturation += max(accumulate(vec2(rim), 0.75, scale * 0.25), -0.25);\n\n  gl_FragColor = vec4(\n    mix(diffuseB, diffuse, saturation) * opacity,\n    clamp(saturation, 0.2, 1.0) * opacity);\n}\n";
},"useData":true});

this["App"]["shaders"]["tentacle-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "uniform vec3 diffuse;\nuniform float opacity;\nuniform float area;\nvarying float centerDist;\n\nvoid main() {\n  float illumination = area * 2.0 / (centerDist * centerDist);\n  gl_FragColor = vec4(\n    mix(vec3(1.0), diffuse, clamp(illumination, 0.0, 1.25)),\n    clamp(opacity * illumination * illumination, 0.0, opacity));\n}\n";
},"useData":true});

this["App"]["shaders"]["tentacle-vert"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return "uniform float area;\nvarying float centerDist;\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_pars_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.color_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  centerDist = length(position);\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.lerp_pos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.worldpos_vertex : stack1), depth0)) != null ? stack1 : "")
    + "\n}\n";
},"useData":true});

this["App"]["shaders"]["uvs-frag"] = Handlebars.template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, alias1=container.lambda;

  return "uniform vec3 diffuse;\nuniform float opacity;\n\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.common : stack1), depth0)) != null ? stack1 : "")
    + "\n"
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_pars_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\nvoid main() {\n  vec4 diffuseColor = vec4(diffuse, opacity);\n\n  "
    + ((stack1 = alias1(((stack1 = (depth0 != null ? depth0.chunks : depth0)) != null ? stack1.map_fragment : stack1), depth0)) != null ? stack1 : "")
    + "\n\n  gl_FragColor = vec4(vUv.xy, 0.0, opacity);\n}\n";
},"useData":true});