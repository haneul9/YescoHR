/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Decimal',
  ],
  (
    // prettier 방지용 주석
    AppUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.roleDescription.Main', {
      initializeModel() {
        return {
          busy: false,
          data: {
            isLoaded: true,
            tree: [],
            roleM: { list: [] },
            role1: { list: [], rowCount: 1 },
            role2: { list: [], rowCount: 1 },
            role3: { list: [], rowCount: 1 },
            role4: { list: [], rowCount: 1 },
            role5: { list: [], rowCount: 1 },
            role6: { list: [], rowCount: 1 },
            role7: { list: [], rowCount: 1 },
            role8: { list: [], rowCount: 1 },
            role9: { list: [], rowCount: 1 },
          },
        };
      },

      async onObjectMatched() {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setSizeLimit(500);
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/busy', true);

          const aTreeData = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'DescriptionTree', {
            Mode: '2',
            Datum: moment().hours(9).toDate(),
          });

          oViewModel.setProperty('/Define/tree', this.oDataChangeTree(aTreeData));

          TableUtils.adjustRowSpan({ oTable: this.byId('roleDesc2Table'), aColIndices: [0, 1], sTheadOrTbody: 'tbody' });
          TableUtils.adjustRowSpan({ oTable: this.byId('roleDesc3Table'), aColIndices: [1], sTheadOrTbody: 'tbody' });
          TableUtils.adjustRowSpan({ oTable: this.byId('roleDesc4Table'), aColIndices: [0, 4, 5, 6], sTheadOrTbody: 'thead' });
          TableUtils.adjustRowSpan({ oTable: this.byId('roleDesc4Table'), aColIndices: [0, 1, 2, 3, 5, 6], sTheadOrTbody: 'tbody' });
          TableUtils.adjustRowSpan({ oTable: this.byId('roleDesc6Table'), aColIndices: [0, 4, 5], sTheadOrTbody: 'thead' });
          TableUtils.adjustRowSpan({ oTable: this.byId('roleDesc7Table'), aColIndices: [0, 4, 5], sTheadOrTbody: 'thead' });

          // await this.callRoleData(this.getAppointeeProperty('Stell'));
        } catch (oError) {
          this.debug('Controller > roleDescription App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      async onPressTreeItem(oEvent) {
        const oSelectedTreeItem = oEvent.getParameter('listItem').getBindingContext().getObject();

        if (oSelectedTreeItem.Otype !== 'C') return;

        await this.callRoleData(oSelectedTreeItem.Objid);
      },

      async callRoleData(sObjid) {
        const oViewModel = this.getViewModel();

        try {
          const mDeepRoleResult = await Client.deep(this.getModel(ServiceNames.APPRAISAL), 'RoleDescriptionMain', {
            Plans: sObjid,
            Datum: moment().hours(9).toDate(),
            RoleDescription1Set: [],
            RoleDescription2Set: [],
            RoleDescription3Set: [],
            RoleDescription4Set: [],
            RoleDescription5Set: [],
            RoleDescription6Set: [],
            RoleDescription7Set: [],
            RoleDescription8Set: [],
            RoleDescription9Set: [],
          });

          oViewModel.setProperty('/data/roleM', _.pick(mDeepRoleResult, ['Planstx', 'Bukrstx', 'Orgtx', 'Ename', 'Zzjikgbt', 'Bidat', 'Defin', 'Defin2', 'Slabs', 'Mtmjr', 'Pfmjr']));
          oViewModel.setProperty('/data/role1', {
            rowCount: mDeepRoleResult.RoleDescription1Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription1Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/data/role2', {
            rowCount: mDeepRoleResult.RoleDescription2Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription2Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/data/role3', {
            rowCount: mDeepRoleResult.RoleDescription3Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription3Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/data/role4', {
            rowCount: mDeepRoleResult.RoleDescription4Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription4Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/data/role5', {
            rowCount: mDeepRoleResult.RoleDescription5Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription5Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/data/role6', {
            rowCount: mDeepRoleResult.RoleDescription6Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription6Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/data/role7', {
            rowCount: mDeepRoleResult.RoleDescription7Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription7Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/data/role8', {
            rowCount: mDeepRoleResult.RoleDescription8Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription8Set.results, (o) => _.omit(o, '__metadata')),
          });
          oViewModel.setProperty('/data/role9', {
            rowCount: mDeepRoleResult.RoleDescription9Set.results.length,
            list: _.map(mDeepRoleResult.RoleDescription9Set.results, (o) => _.omit(o, '__metadata')),
          });
        } catch (oError) {
          this.debug('Controller > roleDescription App > callRoleData Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPress3TableRow() {
        // const oViewModel = this.getViewModel();
        // const oRowData = oEvent.getParameter('rowBindingContext').getObject();
        // if (_.isEmpty(oRowData.Zzobjid)) return;
        // this.callCompetencyData(oRowData.Zzobjid);
      },

      onPress4TableRow() {},

      onPress5TableRow() {},

      onPress6TableRow() {},

      onPress7TableRow() {},

      openJob() {
        const sHost = window.location.href.split('#')[0];
        const sObjid = '13002048';

        window.open(`${sHost}#/jobDefine/${sObjid}`, '_blank', 'width=1300,height=800');
      },

      openCompetency() {
        const sHost = window.location.href.split('#')[0];
        const sObjid = '14001001';
        const sTitle = 'Integrity';

        window.open(`${sHost}#/jobCompetency/${sObjid}/${sTitle}`, '_blank', 'width=1300,height=800');
      },

      oDataChangeTree(aList = []) {
        const aConvertedList = _.chain(aList)
          .cloneDeep()
          .map((o) => _.omit(o, '__metadata'))
          .value();
        const mGroupedByParents = _.groupBy(aConvertedList, 'Upobjid');
        const mCatsById = _.keyBy(aConvertedList, 'Objid');
        const oTree = this.byId('roleTree');

        oTree.collapseAll();
        oTree.expandToLevel(1);
        _.each(_.omit(mGroupedByParents, '00000000'), (Noteren, parentId) => _.set(mCatsById, [parentId, 'Noteren'], Noteren));

        return mGroupedByParents['00000000'];
      },
    });
  }
);
