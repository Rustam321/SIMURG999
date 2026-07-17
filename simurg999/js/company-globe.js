/* Wireframe dotted globe — adapted from
   https://21st.dev/community/components/shadway/wireframe-dotted-globe/default
   (React + d3 component, ported to vanilla JS/canvas for this static site) */
(function () {
  function initGlobe() {
    var canvas = document.getElementById('companyGlobeCanvas');
    if (!canvas || typeof d3 === 'undefined') return;
    var context = canvas.getContext('2d');
    if (!context) return;

    var wrap = canvas.parentElement;

    function getSize() {
      var w = (wrap && wrap.clientWidth) || 420;
      return Math.max(220, Math.min(w, 440));
    }

    var containerWidth = getSize();
    var containerHeight = containerWidth;
    var radius = containerWidth / 2.3;

    var dpr = window.devicePixelRatio || 1;
    canvas.width = containerWidth * dpr;
    canvas.height = containerHeight * dpr;
    canvas.style.width = containerWidth + 'px';
    canvas.style.height = containerHeight + 'px';
    context.scale(dpr, dpr);

    var projection = d3.geoOrthographic()
      .scale(radius)
      .translate([containerWidth / 2, containerHeight / 2])
      .clipAngle(90);

    var path = d3.geoPath().projection(projection).context(context);

    function pointInPolygon(point, polygon) {
      var x = point[0], y = point[1];
      var inside = false;
      for (var i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        var xi = polygon[i][0], yi = polygon[i][1];
        var xj = polygon[j][0], yj = polygon[j][1];
        if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
          inside = !inside;
        }
      }
      return inside;
    }

    function pointInFeature(point, feature) {
      var geometry = feature.geometry;
      if (geometry.type === 'Polygon') {
        var coords = geometry.coordinates;
        if (!pointInPolygon(point, coords[0])) return false;
        for (var i = 1; i < coords.length; i++) {
          if (pointInPolygon(point, coords[i])) return false;
        }
        return true;
      } else if (geometry.type === 'MultiPolygon') {
        for (var p = 0; p < geometry.coordinates.length; p++) {
          var polygon = geometry.coordinates[p];
          if (pointInPolygon(point, polygon[0])) {
            var inHole = false;
            for (var k = 1; k < polygon.length; k++) {
              if (pointInPolygon(point, polygon[k])) { inHole = true; break; }
            }
            if (!inHole) return true;
          }
        }
        return false;
      }
      return false;
    }

    function generateDotsInPolygon(feature, dotSpacing) {
      dotSpacing = dotSpacing || 16;
      var dots = [];
      var bounds = d3.geoBounds(feature);
      var minLng = bounds[0][0], minLat = bounds[0][1];
      var maxLng = bounds[1][0], maxLat = bounds[1][1];
      var stepSize = dotSpacing * 0.08;
      for (var lng = minLng; lng <= maxLng; lng += stepSize) {
        for (var lat = minLat; lat <= maxLat; lat += stepSize) {
          var point = [lng, lat];
          if (pointInFeature(point, feature)) dots.push(point);
        }
      }
      return dots;
    }

    var allDots = [];
    var landFeatures = null;

    function render() {
      context.clearRect(0, 0, containerWidth, containerHeight);
      var currentScale = projection.scale();
      var scaleFactor = currentScale / radius;

      context.beginPath();
      context.arc(containerWidth / 2, containerHeight / 2, currentScale, 0, 2 * Math.PI);
      context.fillStyle = '#040b1c';
      context.fill();
      context.strokeStyle = 'rgba(95,184,255,.55)';
      context.lineWidth = 1.4 * scaleFactor;
      context.stroke();

      if (landFeatures) {
        var graticule = d3.geoGraticule();
        context.beginPath();
        path(graticule());
        context.strokeStyle = 'rgba(95,184,255,.28)';
        context.lineWidth = 0.6 * scaleFactor;
        context.globalAlpha = 0.5;
        context.stroke();
        context.globalAlpha = 1;

        context.beginPath();
        landFeatures.features.forEach(function (feature) { path(feature); });
        context.strokeStyle = 'rgba(95,184,255,.7)';
        context.lineWidth = 0.8 * scaleFactor;
        context.stroke();

        allDots.forEach(function (dot) {
          var projected = projection([dot.lng, dot.lat]);
          if (
            projected &&
            projected[0] >= 0 && projected[0] <= containerWidth &&
            projected[1] >= 0 && projected[1] <= containerHeight
          ) {
            context.beginPath();
            context.arc(projected[0], projected[1], 1.15 * scaleFactor, 0, 2 * Math.PI);
            context.fillStyle = '#5fb8ff';
            context.fill();
          }
        });
      }
    }

    function loadWorldData() {
      fetch('data/ne_110m_land.json')
        .then(function (r) {
          if (!r.ok) throw new Error('failed to load land data');
          return r.json();
        })
        .then(function (data) {
          landFeatures = data;
          landFeatures.features.forEach(function (feature) {
            generateDotsInPolygon(feature, 16).forEach(function (d) {
              allDots.push({ lng: d[0], lat: d[1] });
            });
          });
          render();
        })
        .catch(function () {
          /* keep the plain wireframe globe if land data can't be fetched */
        });
    }

    var rotation = [0, -12];
    var autoRotate = true;
    var rotationSpeed = 0.35;
    projection.rotate(rotation);

    var timer = d3.timer(function () {
      if (autoRotate) {
        rotation[0] += rotationSpeed;
        projection.rotate(rotation);
        render();
      }
    });

    function handleDragStart(clientX, clientY) {
      autoRotate = false;
      var startX = clientX, startY = clientY;
      var startRotation = rotation.slice();

      function move(x, y) {
        var dx = x - startX, dy = y - startY;
        rotation[0] = startRotation[0] + dx * 0.5;
        rotation[1] = Math.max(-90, Math.min(90, startRotation[1] - dy * 0.5));
        projection.rotate(rotation);
        render();
      }
      function onMouseMove(e) { move(e.clientX, e.clientY); }
      function onTouchMove(e) {
        if (e.touches && e.touches[0]) {
          move(e.touches[0].clientX, e.touches[0].clientY);
          e.preventDefault();
        }
      }
      function end() {
        document.removeEventListener('mousemove', onMouseMove);
        document.removeEventListener('mouseup', end);
        document.removeEventListener('touchmove', onTouchMove);
        document.removeEventListener('touchend', end);
        setTimeout(function () { autoRotate = true; }, 1200);
      }
      document.addEventListener('mousemove', onMouseMove);
      document.addEventListener('mouseup', end);
      document.addEventListener('touchmove', onTouchMove, { passive: false });
      document.addEventListener('touchend', end);
    }

    canvas.addEventListener('mousedown', function (e) {
      handleDragStart(e.clientX, e.clientY);
    });
    canvas.addEventListener('touchstart', function (e) {
      if (e.touches && e.touches[0]) handleDragStart(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var factor = e.deltaY > 0 ? 0.92 : 1.08;
      var newScale = Math.max(radius * 0.65, Math.min(radius * 2, projection.scale() * factor));
      projection.scale(newScale);
      render();
    }, { passive: false });

    render();
    loadWorldData();

    window.addEventListener('resize', function () {
      var size = getSize();
      if (Math.abs(size - containerWidth) < 8) return;
      containerWidth = size;
      containerHeight = size;
      radius = containerWidth / 2.3;
      dpr = window.devicePixelRatio || 1;
      canvas.width = containerWidth * dpr;
      canvas.height = containerHeight * dpr;
      canvas.style.width = containerWidth + 'px';
      canvas.style.height = containerHeight + 'px';
      context.setTransform(1, 0, 0, 1, 0, 0);
      context.scale(dpr, dpr);
      projection.scale(radius).translate([containerWidth / 2, containerHeight / 2]);
      render();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initGlobe);
  } else {
    initGlobe();
  }
})();
