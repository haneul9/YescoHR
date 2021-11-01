sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/suite/ui/commons/util/DateUtils',
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    DateUtils,
    JSONModel,
    BaseController
  ) {
    'use strict';

    function convertData(oEvent) {
      var oData,
        oModel = oEvent.getSource();

      if (!oEvent.getParameters().success) {
        return;
      }

      oData = oModel.getData();
      oData.Employees.forEach(function (oEmployee) {
        oEmployee.HireDateTime = DateUtils.parseDate(oEmployee.HireDateTime);
        oEmployee.Photo = sap.ui.require.toUrl(`sap/ui/yesco/image/${oEmployee.Photo}`);
      });
      oModel.updateBindings(true);
      oModel.refresh();
    }

    class Timeline extends BaseController {
      onBeforeShow() {
        var oModel = new JSONModel(sap.ui.require.toUrl('sap/ui/yesco/localService/timeline.json'));
        oModel.attachRequestCompleted(convertData);
        this._timeline = this.byId('idTimeline');
        this._timeline.setModel(oModel);

        this.getView().attachEvent('afterRendering', function () {
          // in production you would probably want to use something like ScrollContainer
          // but for demo purpose we want to keep it simple
          // sctretch:true on container prevents scrolling by default
          jQuery('section').css('overflow', 'auto');
        });
      }
      enableScrollSelected(oEvent) {
        var bSelected = oEvent.getParameter('selected');
        this._timeline.setEnableScroll(bSelected);
      }
      textHeightChanged(oEvent) {
        var sKey = oEvent.getParameter('selectedItem').getProperty('key');
        this._timeline.setTextHeight(sKey);
      }
      groupByChanged(oEvent) {
        var sKey = oEvent.getParameter('selectedItem').getProperty('key');
        this._timeline.setGroupByType(sKey);
      }
      alignmentChanged(oEvent) {
        var sKey = oEvent.getParameter('selectedItem').getProperty('key');
        if (sKey === 'DoubleSided') {
          this._timeline.setEnableDoubleSided(true);
        } else {
          this._timeline.setEnableDoubleSided(false);
          this._timeline.setAlignment(sKey);
        }
      }
      orientationChanged(oEvent) {
        var sKey = oEvent.getParameter('selectedItem').getProperty('key'),
          itemA = sKey === 'Horizontal' ? 'Top' : 'Left',
          itemB = sKey === 'Horizontal' ? 'Bottom' : 'Right',
          oFirstItem = this.byId('idAlignmentFirst'),
          oSecondItem = this.byId('idAlignmentSecond');

        oFirstItem.setText(itemA);
        oFirstItem.setKey(itemA);

        oSecondItem.setText(itemB);
        oSecondItem.setKey(itemB);

        this._timeline.setAxisOrientation(sKey);
      }
    }

    return Timeline;
  }
);
