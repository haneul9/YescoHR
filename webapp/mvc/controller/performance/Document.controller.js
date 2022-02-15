sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/model/json/JSONModel',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/performance/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Percent',
  ],
  (
    // prettier 방지용 주석
    JSONModel,
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.performance.Document', {
      getCurrentLocationText() {
        return this.getBundleText('LABEL_00100'); // 조회
      },

      initializeFieldsControl(acc, cur) {
        return { ...acc, [cur]: Constants.DISPLAY_TYPE.DISPLAY_ONLY };
      },

      initializeGoalItem(obj, index) {
        return {
          rootPath: _.chain(Constants.GOAL_TYPE).findKey({ code: obj.Z101 }).toLower().value(),
          expanded: _.stubFalse(),
          isSaved: _.stubTrue(),
          OrderNo: String(index),
          ItemNo: String(index + 1),
          ..._.chain(obj).omit('AppraisalDoc').omit('__metadata').value(),
          ..._.chain(Constants.COMBO_PROPERTIES)
            .reduce((acc, cur) => ({ ...acc, [cur]: _.isEmpty(obj[cur]) ? 'ALL' : obj[cur] }), _.stubObject())
            .value(),
        };
      },

      initializeModel() {
        return {
          busy: false,
          param: {},
          type: '',
          year: moment().format('YYYY'),
          tab: { selectedKey: Constants.TAB.GOAL },
          appointee: {},
          entry: {
            levels: [],
            topGoals: [],
            grades: [],
            status: [],
          },
          manage: {},
          summary: {},
          currentItemsLength: 0,
          fieldControl: {
            display: _.reduce([...Constants.GOAL_PROPERTIES, ...Constants.SUMMARY_PROPERTIES, ...Constants.MANAGE_PROPERTIES, ...Constants.REJECT_PROPERTIES], this.initializeFieldsControl.bind(this), {}),
            limit: {},
          },
          goals: {
            strategy: [],
            duty: [],
          },
        };
      },

      async onObjectMatched(oParameter) {
        const oViewModel = this.getViewModel();
        const { sType, sPernr, sDocid } = oParameter;

        oViewModel.setData(this.initializeModel());
        oViewModel.setProperty('/busy', true);

        try {
          this.setAppointee(sPernr);

          oViewModel.setProperty('/type', sType);

          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [aTopGoals, aStatus, aFinalStatus, aGrades, mDetailData] = await Promise.all([
            fCurriedGetEntitySet('RelaUpTarget', { Zzappee: sPernr }),
            fCurriedGetEntitySet('AppValueList', { VClass: 'Q', VType: '807' }),
            fCurriedGetEntitySet('AppValueList', { VClass: 'Q', VType: '801' }),
            fCurriedGetEntitySet('AppGradeList'),
            Client.deep(oModel, 'AppraisalDoc', {
              Menid: this.getCurrentMenuId(),
              Prcty: Constants.PROCESS_TYPE.DETAIL.code,
              Zdocid: sDocid,
              Zzappee: sPernr,
              Zzappgb: sType,
              AppraisalDocDetailSet: [],
              AppraisalBottnsSet: [],
              AppraisalScreenSet: [],
            }),
          ]);

          // Combo Entry
          oViewModel.setProperty('/entry/topGoals', new ComboEntry({ codeKey: 'Objid', valueKey: 'Stext', aEntries: aTopGoals }) ?? []);
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);
          oViewModel.setProperty('/entry/status', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aStatus }) ?? []);
          oViewModel.setProperty('/entry/statusF', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aFinalStatus }) ?? []);

          // 합계점수
          oViewModel.setProperty('/summary', {
            ..._.chain({ ...mDetailData })
              .pick(Constants.SUMMARY_PROPERTIES)
              .set('Zmbgrade', _.isEmpty(mDetailData.Zmbgrade) ? 'ALL' : mDetailData.Zmbgrade)
              .value(),
          });

          // 상시관리
          oViewModel.setProperty('/manage', { ..._.pick({ ...mDetailData }, Constants.MANAGE_PROPERTIES) });

          // 목표(전략/직무)
          const mGroupDetailByZ101 = _.groupBy(mDetailData.AppraisalDocDetailSet.results, 'Z101');

          _.forEach(Constants.GOAL_TYPE, (v) => oViewModel.setProperty(`/goals/${v.name}`, _.map(mGroupDetailByZ101[v.code], this.initializeGoalItem.bind(this)) ?? []));
        } catch (oError) {
          this.debug(`Controller > Performance Document > onObjectMatched Error`, oError);

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

      /*****************************************************************
       * ! Event handler
       *****************************************************************/

      /*****************************************************************
       * ! Call oData
       *****************************************************************/
    });
  }
);
