sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/exceptions/UI5Error',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/idp/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Percent',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    ComboEntry,
    Client,
    UI5Error,
    ServiceNames,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.idp.Document', {
      initializeModel() {
        return {
          busy: false,
          hasNoData: true,
          tab: { selectedKey: Constants.TAB.COMP },
          appointee: {},
          searchConditions: { Zyear: '' },
          entry: { levels: [], years: [] },
          goals: {
            comp: [],
          },
        };
      },

      initializeItem(obj, index) {
        return {
          expanded: _.stubFalse(),
          isSaved: _.stubTrue(),
          OrderNo: String(index),
          ItemNo: String(index + 1),
          ..._.chain(obj).omit('__metadata').value(),
          ..._.chain(Constants.COMBO_PROPERTIES)
            .reduce((acc, cur) => ({ ...acc, [cur]: _.isEmpty(obj[cur]) ? 'ALL' : obj[cur] }), _.stubObject())
            .value(),
        };
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        setTimeout(() => $('#container-ehr---app--app').addClass('popup-body'), 200);

        try {
          if (_.isEmpty(oParameter)) {
            throw new UI5Error({ code: 'E', message: this.getBundleText('MSG_00043') }); // 잘못된 접근입니다.
          }

          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const sPernr = oParameter.sPernr;

          await this.setAppointee(sPernr);

          const aGrades = await Client.getEntitySet(oModel, 'AppGradeList');
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);

          const aYears = await Client.getEntitySet(oModel, 'AppraisalIdpYear', { Pernr: sPernr });
          const sPrevYear = _.isEmpty(oParameter.sZyear) ? moment().subtract(1, 'years').format('YYYY') : oParameter.sZyear;
          oViewModel.setProperty('/searchConditions/Zyear', sPrevYear);
          oViewModel.setProperty('/entry/years', aYears || []);

          const { Zzappid: sZzappid, Zdocid: sZdocid } = _.find(aYears, { Year: sPrevYear });

          if (_.isEmpty(sZzappid) || _.isEmpty(sZdocid)) return;

          const mDetailData = await Client.deep(oModel, 'AppraisalIdpDoc', {
            Menid: this.getCurrentMenuId(),
            Prcty: Constants.PROCESS_TYPE.DETAIL.code,
            Zzappgb: 'ME',
            Zzappee: sPernr,
            Zdocid: sZdocid,
            Zzappid: sZzappid,
            AppraisalIdpDocDetSet: [],
            AppraisalBottnsSet: [],
            AppraisalScreenSet: [],
          });

          // 팀장의견
          oViewModel.setProperty('/manage', { ..._.pick({ ...mDetailData }, Constants.MANAGE_PROPERTIES) });

          // 직무역량
          oViewModel.setProperty('/hasNoData', _.isEmpty(mDetailData.AppraisalIdpDocDetSet.results));
          oViewModel.setProperty('/goals/comp', _.map(mDetailData.AppraisalIdpDocDetSet.results, this.initializeItem.bind(this)) ?? []);
        } catch (oError) {
          this.debug(`Controller > IDP Document > onObjectMatched Error`, oError);

          AppUtils.handleError(oError, {
            onClose: () => window.close(),
          });
        } finally {
          sap.ui.getCore().byId('container-ehr---app--appMenuToolbar').setVisible(false);
          oViewModel.setProperty('/busy', false);
        }
      },

      async setAppointee(sPernr) {
        const oViewModel = this.getViewModel();
        const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
          Ename: sPernr,
        });

        oViewModel.setProperty('/appointee', { ...mAppointee, Orgtx: mAppointee.Fulln, Photo: mAppointee.Photo || 'asset/image/avatar-unknown.svg' });
      },

      async onChangeYear(oEvent) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/busy', true);

        try {
          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const { Zzappid: sZzappid, Zdocid: sZdocid } = oEvent.getSource().getSelectedItem().getBindingContext().getObject();
          const mDetailData = await Client.deep(oModel, 'AppraisalIdpDoc', {
            Menid: this.getCurrentMenuId(),
            Prcty: Constants.PROCESS_TYPE.DETAIL.code,
            Zzappgb: 'ME',
            Zzappee: oViewModel.getProperty('/appointee/Pernr'),
            Zdocid: sZdocid,
            Zzappid: sZzappid,
            AppraisalIdpDocDetSet: [],
            AppraisalBottnsSet: [],
            AppraisalScreenSet: [],
          });

          // 팀장의견
          oViewModel.setProperty('/manage', { ..._.pick({ ...mDetailData }, Constants.MANAGE_PROPERTIES) });

          // 직무역량
          oViewModel.setProperty('/hasNoData', _.isEmpty(mDetailData.AppraisalIdpDocDetSet.results));
          oViewModel.setProperty(`/goals/comp`, _.map(mDetailData.AppraisalIdpDocDetSet.results, this.initializeItem.bind(this)) ?? []);
        } catch (oError) {
          this.debug(`Controller > IDP Document > onPressSearch Error`, oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },
    });
  }
);
