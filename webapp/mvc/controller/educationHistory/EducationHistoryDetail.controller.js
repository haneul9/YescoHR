/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/FragmentEvent',
    'sap/ui/yesco/common/TextUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Date',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    FragmentEvent,
    TextUtils,
    TableUtils,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.educationHistory.EducationHistoryDetail', {
      LIST_PAGE_ID: 'container-ehr---educationHistory',

      TextUtils: TextUtils,
      TableUtils: TableUtils,
      FragmentEvent: FragmentEvent,

      initializeModel() {
        return {
          FormData: {},
          busy: false,
        };
      },

      eduPeriod(v1 = moment().toDate(), v2 = moment().toDate()) {
        v1 = moment(v1).format('YYYY.MM.DD');
        v2 = moment(v2).format('YYYY.MM.DD');
        return `${v1} ~ ${v2}`;
      },

      // setData
      async onObjectMatched(oParameter) {
        const oDetailModel = this.getViewModel();

        oDetailModel.setData(this.initializeModel());

        try {
          oDetailModel.setProperty('/busy', true);

          const oView = this.getView();
          const oListView = oView.getParent().getPage(this.LIST_PAGE_ID);
          const mParameters = oListView.getModel().getProperty('/parameters');

          oDetailModel.setProperty('/FormData', mParameters);
        } catch (oError) {
          this.debug(oError);
          AppUtils.handleError(oError);
        } finally {
          oDetailModel.setProperty('/busy', false);
        }
      },

      getCurrentLocationText(oArguments) {
        return this.getBundleText('LABEL_00165');
      },
    });
  }
);
