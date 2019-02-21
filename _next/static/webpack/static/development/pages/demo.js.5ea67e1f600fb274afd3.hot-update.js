webpackHotUpdate("static/development/pages/demo.js",{

/***/ "./docs/components/Page.js":
/*!*********************************!*\
  !*** ./docs/components/Page.js ***!
  \*********************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! react */ "./node_modules/react/index.js");
/* harmony import */ var react__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(react__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _emotion_core__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @emotion/core */ "./node_modules/@emotion/core/dist/core.browser.esm.js");
/* harmony import */ var _Layout__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./Layout */ "./docs/components/Layout.js");
/* harmony import */ var _styles_Typography__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ../styles/Typography */ "./docs/styles/Typography.js");
/* harmony import */ var codemirror_lib_codemirror_css__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! codemirror/lib/codemirror.css */ "./node_modules/codemirror/lib/codemirror.css");
/* harmony import */ var codemirror_lib_codemirror_css__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(codemirror_lib_codemirror_css__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _static_css_app_css__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ../../static/css/app.css */ "./static/css/app.css");
/* harmony import */ var _static_css_app_css__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_static_css_app_css__WEBPACK_IMPORTED_MODULE_5__);
/* harmony import */ var _static_css_formatic_css__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ../../static/css/formatic.css */ "./static/css/formatic.css");
/* harmony import */ var _static_css_formatic_css__WEBPACK_IMPORTED_MODULE_6___default = /*#__PURE__*/__webpack_require__.n(_static_css_formatic_css__WEBPACK_IMPORTED_MODULE_6__);
/* harmony import */ var sanitize_css__WEBPACK_IMPORTED_MODULE_7__ = __webpack_require__(/*! sanitize.css */ "./node_modules/sanitize.css/sanitize.css");
/* harmony import */ var sanitize_css__WEBPACK_IMPORTED_MODULE_7___default = /*#__PURE__*/__webpack_require__.n(sanitize_css__WEBPACK_IMPORTED_MODULE_7__);


function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; var ownKeys = Object.keys(source); if (typeof Object.getOwnPropertySymbols === 'function') { ownKeys = ownKeys.concat(Object.getOwnPropertySymbols(source).filter(function (sym) { return Object.getOwnPropertyDescriptor(source, sym).enumerable; })); } ownKeys.forEach(function (key) { _defineProperty(target, key, source[key]); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/** @jsx jsx */







var pages = {
  start: {
    url: '/start',
    title: 'Getting Started',
    subTitle: 'Installing and using Formatic'
  },
  demo: {
    url: '/demo',
    title: 'Field Types',
    subTitle: 'The whole kitchen sink'
  },
  plugins: {
    url: '/plugins',
    navTitle: 'Plugins',
    title: 'Extending Formatic'
  },
  github: {
    url: 'http://github.com/zapier/formatic',
    title: 'GitHub'
  }
};
var styles = {
  body:
  /*#__PURE__*/
  Object(_emotion_core__WEBPACK_IMPORTED_MODULE_1__["css"])(_objectSpread({}, _styles_Typography__WEBPACK_IMPORTED_MODULE_3__["default"]['body-large']), "label:Page--body;/*# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi9Vc2Vycy9qdXN0aW4vZ2l0L2Zvcm1hdGljL2RvY3MvY29tcG9uZW50cy9QYWdlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQWtDUSIsImZpbGUiOiIvVXNlcnMvanVzdGluL2dpdC9mb3JtYXRpYy9kb2NzL2NvbXBvbmVudHMvUGFnZS5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qKiBAanN4IGpzeCAqL1xuaW1wb3J0IHsganN4LCBjc3MgfSBmcm9tICdAZW1vdGlvbi9jb3JlJztcbmltcG9ydCBMYXlvdXQgZnJvbSAnLi9MYXlvdXQnO1xuXG5pbXBvcnQgVHlwb2dyYXBoeSBmcm9tICcuLi9zdHlsZXMvVHlwb2dyYXBoeSc7XG5cbmltcG9ydCAnY29kZW1pcnJvci9saWIvY29kZW1pcnJvci5jc3MnO1xuaW1wb3J0ICcuLi8uLi9zdGF0aWMvY3NzL2FwcC5jc3MnO1xuaW1wb3J0ICcuLi8uLi9zdGF0aWMvY3NzL2Zvcm1hdGljLmNzcyc7XG5pbXBvcnQgJ3Nhbml0aXplLmNzcyc7XG5cbmNvbnN0IHBhZ2VzID0ge1xuICBzdGFydDoge1xuICAgIHVybDogJy9zdGFydCcsXG4gICAgdGl0bGU6ICdHZXR0aW5nIFN0YXJ0ZWQnLFxuICAgIHN1YlRpdGxlOiAnSW5zdGFsbGluZyBhbmQgdXNpbmcgRm9ybWF0aWMnLFxuICB9LFxuICBkZW1vOiB7XG4gICAgdXJsOiAnL2RlbW8nLFxuICAgIHRpdGxlOiAnRmllbGQgVHlwZXMnLFxuICAgIHN1YlRpdGxlOiAnVGhlIHdob2xlIGtpdGNoZW4gc2luaycsXG4gIH0sXG4gIHBsdWdpbnM6IHtcbiAgICB1cmw6ICcvcGx1Z2lucycsXG4gICAgbmF2VGl0bGU6ICdQbHVnaW5zJyxcbiAgICB0aXRsZTogJ0V4dGVuZGluZyBGb3JtYXRpYycsXG4gIH0sXG4gIGdpdGh1Yjoge1xuICAgIHVybDogJ2h0dHA6Ly9naXRodWIuY29tL3phcGllci9mb3JtYXRpYycsXG4gICAgdGl0bGU6ICdHaXRIdWInLFxuICB9LFxufTtcblxuY29uc3Qgc3R5bGVzID0ge1xuICBib2R5OiBjc3Moe1xuICAgIC4uLlR5cG9ncmFwaHlbJ2JvZHktbGFyZ2UnXSxcbiAgfSksXG59O1xuXG5jb25zdCBQYWdlID0gcHJvcHMgPT4gKFxuICA8TGF5b3V0IHBhZ2VzPXtwYWdlc30gcGFnZUtleT17cHJvcHMucGFnZUtleX0+XG4gICAgPGRpdiBjc3M9e3N0eWxlcy5ib2R5fT57cHJvcHMuY2hpbGRyZW59PC9kaXY+XG4gIDwvTGF5b3V0PlxuKTtcblxuZXhwb3J0IGRlZmF1bHQgUGFnZTtcbiJdfQ== */")
};

var Page = function Page(props) {
  return Object(_emotion_core__WEBPACK_IMPORTED_MODULE_1__["jsx"])(_Layout__WEBPACK_IMPORTED_MODULE_2__["default"], {
    pages: pages,
    pageKey: props.pageKey
  }, Object(_emotion_core__WEBPACK_IMPORTED_MODULE_1__["jsx"])("div", {
    css: styles.body
  }, props.children));
};

/* harmony default export */ __webpack_exports__["default"] = (Page);

/***/ })

})
//# sourceMappingURL=demo.js.5ea67e1f600fb274afd3.hot-update.js.map