sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/ComboEntry',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/controller/competency/constant/Constants',
    'sap/ui/yesco/mvc/model/type/Date',
    'sap/ui/yesco/mvc/model/type/Percent',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    ComboEntry,
    Client,
    ServiceNames,
    BaseController,
    Constants
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.competency.Document', {
      getPreviousRouteName() {
        return _.chain(this.getRouter().getHashChanger().getHash()).split('/').dropRight(2).join('/').value();
      },

      getCurrentLocationText(oArguments) {
        return oArguments.sYear ?? moment().format('YYYY');
      },

      initializeFieldsControl(acc, cur) {
        return { ...acc, [cur]: Constants.DISPLAY_TYPE.EDIT };
      },

      initializeGoalItem(obj) {
        return {
          rootPath: _.chain(Constants.GOAL_TYPE).findKey({ code: obj.Z101 }).toLower().value(),
          expanded: _.stubTrue(),
          ..._.chain(obj).omit('AppraisalCoDoc').omit('__metadata').value(),
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
          appointee: {},
          tab: { selectedKey: Constants.TAB.ABILITY },
          stage: {
            headers: [],
            rows: [],
          },
          level: {
            expanded: false,
            type: 'level5',
            count: 5,
            headers: [],
            rows: [],
          },
          entry: {
            levels: [],
          },
          buttons: {
            submit: {},
            form: {
              Rjctr: '',
              Rjctrin: '',
              confirmEnable: false,
              isRejectProcess: false,
            },
          },
          fieldControl: {
            display: _.reduce([...Constants.GOAL_PROPERTIES, ...Constants.SUMMARY_PROPERTIES, ...Constants.REJECT_PROPERTIES], this.initializeFieldsControl.bind(this), {}),
            limit: {},
          },
          goals: {
            valid: [],
            header: {},
            common: [],
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
          this.setAppointee(sType, sPernr);

          oViewModel.setProperty('/type', sType);
          //   oViewModel.setProperty('/year', sYear);

          const oModel = this.getModel(ServiceNames.APPRAISAL);
          const fCurriedGetEntitySet = Client.getEntitySet(oModel);
          const [aGrades, mDetailData] = await Promise.all([
            fCurriedGetEntitySet('AppValueList', { VClass: 'Q', VType: '702' }),
            Client.deep(oModel, 'AppraisalCoDoc', {
              Menid: this.getCurrentMenuId(),
              Prcty: Constants.PROCESS_TYPE.DETAIL.code,
              Zzappgb: sType,
              Zzappee: sPernr,
              Zdocid: sDocid,
              AppraisalCoDocDetSet: [],
              AppraisalBottnsSet: [],
              AppraisalScreenSet: [],
            }),
          ]);

          // Combo Entry
          oViewModel.setProperty('/entry/levels', new ComboEntry({ codeKey: 'ValueEid', valueKey: 'ValueText', aEntries: aGrades }) ?? []);

          // Header
          oViewModel.setProperty('/summary', { ..._.pick(mDetailData, Constants.SUMMARY_PROPERTIES) });

          // 목표(공통/직무)
          const mGroupDetailByZvbgubun = _.groupBy(mDetailData.AppraisalCoDocDetSet.results, 'Zvbgubun');

          _.forEach(Constants.GOAL_TYPE, (v) => oViewModel.setProperty(`/goals/${v.name}`, _.map(mGroupDetailByZvbgubun[v.code], this.initializeGoalItem.bind(this)) ?? []));
        } catch (oError) {
          this.debug(`Controller > CompetencyView Document > onObjectMatched Error`, oError);

          AppUtils.handleError(oError, {
            onClose: () => window.close(),
          });
        } finally {
          sap.ui.getCore().byId('container-ehr---app--appMenuToolbar').setVisible(false);
          setTimeout(() => $('#container-ehr---app--app').addClass('popup-body'), 200);
          oViewModel.setProperty('/busy', false);
        }
      },

      async setAppointee(sType, sPernr) {
        const oViewModel = this.getViewModel();

        if (_.isEqual(sType, Constants.APPRAISER_TYPE.ME)) {
          oViewModel.setProperty('/appointee', AppUtils.getAppComponent().getAppointeeModel().getData());
        } else {
          const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', { Ename: sPernr });

          oViewModel.setProperty('/appointee', { ...mAppointee, Orgtx: mAppointee.Fulln, Photo: mAppointee.Photo || 'asset/image/avatar-unknown.svg' });
        }
      },

      changeTab(sTabKey) {
        this.getViewModel().setProperty('/tab/selectedKey', sTabKey);
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
