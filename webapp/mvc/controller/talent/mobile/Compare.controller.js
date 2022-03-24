sap.ui.define(
  [
    //
    'sap/ui/core/Fragment',
    'sap/ui/model/Filter',
    'sap/ui/model/FilterOperator',
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    //
    Fragment,
    Filter,
    FilterOperator,
    MessageBox,
    AppUtils,
    ComboEntry,
    UI5Error,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.talent.mobile.Compare', {
      initializeModel() {
        return {
          busy: false,
          compare: {
            scroll: true,
            row1: [],
            row2: [],
            row3: [],
            row4: [],
            row5: [],
            row6: [],
            row7: [],
            row8: [],
            row9: [],
            row10: [],
            row11: [],
          },
        };
      },

      /**
       * @override
       */
      onAfterShow() {
        BaseController.prototype.onAfterShow.apply(this, arguments);

        setTimeout(() => {
          const oBlockLayout = this.byId('BlockLayout');
          const sBlockId = oBlockLayout.getId();
          const $lastBlock = $(`#${sBlockId} > div`);

          $lastBlock.each(function () {
            $(this).off('scroll touchmove mousewheel');
          });

          $lastBlock.each(function () {
            $(this).on('scroll touchmove mousewheel', function () {
              const iScrollLeft = $(this).scrollLeft();

              $lastBlock.not(this).each(function () {
                $(this).scrollLeft(iScrollLeft);
              });
            });
          });
        }, 300);
      },
    });
  }
);
