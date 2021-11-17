sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/controller/BaseController',
  ],
  function (
    // prettier 방지용 주석
    JSONModel,
    BaseController
  ) {
    'use strict';

    class VacationIndicator extends BaseController {
      onBeforeShow() {
        const iTotal = 25;
        this._grid = this.byId('grid').setModel(
          new JSONModel({
            total: iTotal,
            used1: 0, // 사용 일수 0
            used2: 1.5, // 사용 일수 << 남은 일수
            used3: 8.5, // 사용 일수 1/3, 남은 일수 2/3
            used4: iTotal / 2, // 사용 일수 = 남은 일수
            used5: iTotal - 1.5, // 사용 일수 >> 남은 일수
            used6: iTotal, // 남은 일수 0
          })
        );
      }

      onClick() {
        const iTotal = 15;
        this._grid.getModel().setData({
          total: iTotal,
          used1: 0, // 사용 일수 0
          used2: 1.5, // 사용 일수 << 남은 일수
          used3: 5, // 사용 일수 1/3, 남은 일수 2/3
          used4: iTotal / 2, // 사용 일수 = 남은 일수
          used5: iTotal - 1.5, // 사용 일수 >> 남은 일수
          used6: iTotal, // 남은 일수 0
        });
      }
    }

    return VacationIndicator;
  }
);
