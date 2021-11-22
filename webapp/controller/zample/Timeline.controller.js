sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/core/format/DateFormat',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    DateFormat,
    JSONModel,
    BaseController
  ) => {
    'use strict';

    function convertData(oEvent) {
      if (!oEvent.getParameters().success) {
        return;
      }

      const oModel = oEvent.getSource();
      const oData = oModel.getData();
      const oDateParser = DateFormat.getDateInstance({
        source: {
          pattern: 'yyyy.MM.dd',
        },
      });

      oData.Employees.forEach(function (oEmployee) {
        oEmployee.HireDateTime = oDateParser.parse(oEmployee.HireDateTime);
        oEmployee.Photo = sap.ui.require.toUrl(`sap/ui/yesco/image/${oEmployee.Photo}`);
      });

      oModel.updateBindings(true);
    }

    return BaseController.extend('sap.ui.yesco.controller.zample.Timeline', {
      onBeforeShow() {
        const oModel = new JSONModel(sap.ui.require.toUrl('sap/ui/yesco/localService/timeline.json'));
        oModel.attachRequestCompleted(convertData);
        this._timeline = this.byId('idTimeline');
        this._timeline.setModel(oModel);

        this.getView().attachEvent('afterRendering', function () {
          // in production you would probably want to use something like ScrollContainer
          // but for demo purpose we want to keep it simple
          // sctretch:true on container prevents scrolling by default
          $('section').css('overflow', 'auto');
        });
      },

      enableScrollSelected(oEvent) {
        const bSelected = oEvent.getParameter('selected');
        this._timeline.setEnableScroll(bSelected);
      },

      textHeightChanged(oEvent) {
        const sKey = oEvent.getParameter('selectedItem').getProperty('key');
        this._timeline.setTextHeight(sKey);
      },

      groupByChanged(oEvent) {
        const sKey = oEvent.getParameter('selectedItem').getProperty('key');
        this._timeline.setGroupByType(sKey);
      },

      alignmentChanged(oEvent) {
        const sKey = oEvent.getParameter('selectedItem').getProperty('key');
        if (sKey === 'DoubleSided') {
          this._timeline.setEnableDoubleSided(true);
        } else {
          this._timeline.setEnableDoubleSided(false);
          this._timeline.setAlignment(sKey);
        }
      },

      orientationChanged(oEvent) {
        const sKey = oEvent.getParameter('selectedItem').getProperty('key');
        const itemA = sKey === 'Horizontal' ? 'Top' : 'Left';
        const itemB = sKey === 'Horizontal' ? 'Bottom' : 'Right';
        const oFirstItem = this.byId('idAlignmentFirst');
        const oSecondItem = this.byId('idAlignmentSecond');

        oFirstItem.setText(itemA);
        oFirstItem.setKey(itemA);

        oSecondItem.setText(itemB);
        oSecondItem.setKey(itemB);

        this._timeline.setAxisOrientation(sKey);
      },
    });
  }
);
