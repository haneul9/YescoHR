sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.zample.VacationIndicator', {
      onBeforeShow() {
        const iTotal = 25;
        this._grid = this.byId('grid').setModel(
          new JSONModel({
            show1: false,
            show2: true,
            total: iTotal,
            used1: 0, // 사용 일수 0
            used2: 1.5, // 사용 일수 << 남은 일수
            used3: 8.5, // 사용 일수 1/3, 남은 일수 2/3
            used4: iTotal / 2, // 사용 일수 = 남은 일수
            used5: iTotal - 1.5, // 사용 일수 >> 남은 일수
            used6: iTotal, // 남은 일수 0
          })
        );
      },

      onClick1() {
        const iTotal = 15;
        this._grid.getModel().setData({
          show1: true,
          show2: false,
          total: iTotal,
          used1: 0, // 사용 일수 0
          used2: 3, // 사용 일수 << 남은 일수
          used3: 6, // 사용 일수 1/3, 남은 일수 2/3
          used4: iTotal / 2, // 사용 일수 = 남은 일수
          used5: iTotal - 3, // 사용 일수 >> 남은 일수
          used6: iTotal, // 남은 일수 0
        });
      },

      onClick2() {
        const iTotal = 25;
        this._grid.getModel().setData({
          show1: false,
          show2: true,
          total: iTotal,
          used1: 0, // 사용 일수 0
          used2: 1.5, // 사용 일수 << 남은 일수
          used3: 8.5, // 사용 일수 1/3, 남은 일수 2/3
          used4: iTotal / 2, // 사용 일수 = 남은 일수
          used5: iTotal - 1.5, // 사용 일수 >> 남은 일수
          used6: iTotal, // 남은 일수 0
        });
      },
    });
  }
);
