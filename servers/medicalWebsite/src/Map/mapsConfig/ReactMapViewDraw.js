// var Layer, PropTypes, React, Component, ReactMapView, ReactMapboxGl, _, e, theme, MapboxDraw;

// React  = require('react');

// Component = require('react');

// PropTypes = require('prop-types');

// _ = require('underscore');

// theme = require('../../draw-theme');

// ReactMapView = require('./ReactMapView');

// ReactMapboxGl = require('react-mapbox-gl');

// MapboxDraw = require('@mapbox/mapbox-gl-draw');

// Layer = ReactMapboxGl.Layer;

// e = React.createElement;

// module.exports = function(parameters) {
//   var MapView, draw, loaded;
//   MapView = ReactMapView(parameters);
//   draw = new MapboxDraw({
//     userProperties: true,
//     styles: theme,
//     controls: {
//       line_string: true,
//       polygon: true,
//       combine_features: true,
//       uncombine_features: true
//     }
//   });
//   loaded = false;
//   return class ReactMapViewDraw {
//     onLoad = (mapgl) => {
//       const {onEditFeatures, onDeleteFeatures, featureCollection} = this.props;
//       mapgl.addControl(draw);
//       mapgl.on('draw.delete', function({features}) {
//         return onDeleteFeatures(features);
//       });
//       mapgl.on('draw.update', function({features}) {
//         return onEditFeatures(features);
//       });
//       setTimeout(() => {
//         return this.updateFeatureCollection(featureCollection);
//       }, 500);
//       return loaded = true;
//     }
//     getSelected = () => {
//       return draw.getSelected();
//     }
//     getAll = () => {
//       return draw.getAll();
//     }
//     mapgl = () => {
//       return this.refs.map.mapgl();
//     }
//     updateFeatureCollection = (featureCollection) => {
//       return draw.deleteAll().add(featureCollection);
//     }
//     componentWillReceiveProps({featureCollection}) {
//       if (loaded && !_.isEqual(featureCollection, this.props.featureCollection)) {
//         return this.updateFeatureCollection(featureCollection);
//       }
//     }
//     render() {
//       const {map, children} = this.props;
//       return e(MapView, {
//         ref: 'map',
//         map: map,
//         onLoad: this.onLoad
//       }, children);
//     }
//   }
// };


///////////////////////////////////////////////////////////
import React, { Component } from 'react'
import _ from 'underscore'
import theme from '../../draw-theme'
import ReactMapView from './ReactMapView'
import MapboxDraw from '@mapbox/mapbox-gl-draw'

let loaded = false
const draw = new MapboxDraw({
    userProperties: true,
    styles: theme,
    controls: {
      line_string: true,
      polygon: true,
      combine_features: true,
      uncombine_features: true
    }
})

export default class ReactMapViewDraw extends Component {
  constructor(props) {
    super(props);
    this.state = {
      map: ''
    };
    this.MapView = new ReactMapView(props)
    this.mapLocation = React.createRef()
    this.getAll = this.getAll.bind(this);
    this.mapgl = this.mapgl.bind(this);
  }
  //   this.state = {
  //     loaded: false,
  //     // MapView: new ReactMapView(props),
  //     draw: new MapboxDraw({
  //       userProperties: true,
  //       styles: theme,
  //       controls: {
  //         line_string: true,
  //         polygon: true,
  //         combine_features: true,
  //         uncombine_features: true
  //       }
  //     })
  //   };
  // }

  onLoad = (mapgl) => {
    const { onEditFeatures, onDeleteFeatures, featureCollection } = this.props;
    mapgl.addControl(draw);
    mapgl.on('draw.delete', function({features}) {
        onDeleteFeatures(features);
    });
    mapgl.on('draw.update', function({features}) {
        onEditFeatures(features);
    });
    setTimeout(() => {
        this.updateFeatureCollection(featureCollection);
    }, 500);
    loaded = true
};

getSelected = () => {
    return draw.getSelected();
};


getAll = () => {
    return draw.getAll();
}


mapgl = () => {
    return this.mapLocation.current.state.map;
};

updateFeatureCollection = (featureCollection) => {
    draw.deleteAll().add(featureCollection)
};

componentDidUpdate(prevProps) {
  if (loaded && !_.isEqual(prevProps.featureCollection, this.props.featureCollection)) {
      this.updateFeatureCollection(this.props.featureCollection);
  }
    
}

  render() {
    const { map } = this.props;
    console.log (map)
    return(
      <ReactMapView
        ref= {this.mapLocation}
        map= {map}
        onLoad= {this.onLoad}
      />
    )
  }


}
