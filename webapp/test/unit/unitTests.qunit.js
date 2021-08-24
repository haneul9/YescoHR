/* global QUnit */
QUnit.config.autostart = false;

sap.ui.getCore().attachInit(function () {
	"use strict";

	sap.ui.require([
		"com/yescohr/ZUI5_YescoHR/test/unit/AllTests"
	], function () {
		QUnit.start();
	});
});