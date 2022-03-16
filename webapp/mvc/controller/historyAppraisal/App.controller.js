/* eslint-disable no-useless-call */
sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/TableUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
    'sap/ui/yesco/mvc/model/type/Decimal',
    'sap/ui/yesco/mvc/model/type/Pernr',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    TableUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.historyAppraisal.App', {
      initializeModel() {
        return {
          busy: false,
          isMSS: false,
          sideNavigation: {
            busy: false,
            isShow: true,
            treeLoaded: false,
            search: { searchText: '', results: [] },
            treeData: [],
          },
          history: {
            busy: false,
            mode: 'P',
            rowCount: 1,
            list: [],
            entryZyear: [],
            maxDate: moment().toDate(),
            search: { Zyear: null, Otype: '', Objid: '' },
            visible: {
              Zyear: true,
              Pernr: false,
              Ename: false,
              Zzappgd03: false,
            },
          },
          appointee: {},
        };
      },

      async onObjectMatched(mRouteArguments, sRouteName) {
        const oViewModel = this.getViewModel();

        try {
          const mAppointee = this.getAppointeeData();

          oViewModel.setSizeLimit(500);
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/busy', true);

          if (sRouteName === 'historyAppraisal') {
            oViewModel.setProperty('/isESS', true);
          } else {
            oViewModel.setProperty('/isESS', false);
            oViewModel.setProperty('/sideNavigation/search/searchText', mAppointee.Orgtx);

            await this.setAppointee(mAppointee.Pernr);
            await this.onPressEmployeeSearch(mAppointee.Orgeh);
          }

          oViewModel.setProperty('/history/search', { Otype: 'P', Zyear: null, Objid: mAppointee.Pernr });

          await this.onPressSearch();
        } catch (oError) {
          this.debug('Controller > historyAppraisal App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setVisibleColumns(sMode) {
        const oViewModel = this.getViewModel();
        const sPersg = this.getAppointeeProperty('Persg');
        const bIsESS = oViewModel.getProperty('/isESS');

        oViewModel.setProperty('/history/visible', {
          Zzappgd03: !bIsESS && sPersg === 'A',
          Zyear: sMode === 'P',
          Pernr: sMode === 'O',
          Ename: sMode === 'O',
        });
      },

      async setAppointee(sPernr) {
        const oViewModel = this.getViewModel();

        try {
          if (_.isEqual(sPernr, this.getSessionProperty('Pernr'))) {
            oViewModel.setProperty('/appointee', { ...this.getSessionData() });
          } else {
            const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
              Ename: sPernr,
            });

            if (_.isEmpty(mAppointee)) {
              oViewModel.setProperty('/appointee', { Photo: 'asset/image/avatar-unknown.svg' });
            } else {
              oViewModel.setProperty('/appointee', { ...mAppointee, Orgtx: mAppointee.Fulln, Photo: mAppointee.Photo || 'asset/image/avatar-unknown.svg' });
            }
          }
        } catch (oError) {
          this.debug('Controller > historyAppraisal > setAppointee Error', oError);

          AppUtils.handleError(oError);
        }
      },

      onPressRowPerformance(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        if (!oRowData.Zdocid1) return;

        window.open(`${sHost}#/performanceView/ME/${oRowData.Pernr}/${oRowData.Zdocid1}`, '_blank', 'width=1400,height=800');
      },

      onPressRowCompetency(oEvent) {
        const sHost = window.location.href.split('#')[0];
        const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        if (!oRowData.Zdocid2) return;

        window.open(`${sHost}#/competencyView/ME/${oRowData.Pernr}/${oRowData.Zdocid2}`, '_blank', 'width=1300,height=800');
      },

      onPressRowMulti(oEvent) {
        const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        this.debug(oRowData.Zdocid3);
      },

      onPressRowDevelop(oEvent) {
        const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        this.debug(oRowData.Zdocid4);
      },

      openPerformance(sObjid) {
        const sHost = window.location.href.split('#')[0];

        window.open(`${sHost}#/jobDefine/${sObjid}`, '_blank', 'width=1300,height=800');
      },

      openCompetency(sObjid, sTitle) {
        const sHost = window.location.href.split('#')[0];

        window.open(`${sHost}#/jobCompetency/${sObjid}/${sTitle}`, '_blank', 'width=1300,height=800');
      },

      onToggleNavigation(oEvent) {
        const oViewModel = this.getViewModel();
        const oSideBody = this.byId('sideBody');
        const oProfileBody = this.byId('profileBody');
        const bPressed = oEvent.getParameter('pressed');

        oSideBody.toggleStyleClass('expanded', !bPressed);
        oProfileBody.toggleStyleClass('expanded', bPressed);

        setTimeout(
          () => {
            oViewModel.setProperty('/sideNavigation/isShow', !bPressed);
          },
          bPressed ? 100 : 200
        );
      },

      async onSelectSideTab(oEvent) {
        const oViewModel = this.getView().getModel();
        const sSelectedKey = oEvent.getParameter('key');
        const bTreeLoaded = oViewModel.getProperty('/sideNavigation/treeLoaded');

        if (!bTreeLoaded && sSelectedKey === 'tree') {
          const aReturnTreeData = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'AuthOrgTree', { Datum: moment().hour(9).toDate(), Xpern: 'X' });
          const mConvertedTreeData = this.transformTreeData({ aTreeData: aReturnTreeData, sRootId: '00000000' });

          oViewModel.setProperty('/sideNavigation/treeData', mConvertedTreeData);
        }

        oViewModel.setProperty('/sideNavigation/treeLoaded', true);
      },

      transformTreeData({ aTreeData, sRootId }) {
        aTreeData = _.map(aTreeData, (o) =>
          _.chain(o)
            .omit(['Datum', '__metadata'])
            .set('ref', o.Otype === 'O' ? _.noop() : o.Xchif === 'X' ? 'asset/image/icon_employee.svg' : 'asset/image/icon_employee.svg')
            .value()
        );

        const mGroupedByParents = _.groupBy(aTreeData, 'ObjidUp');
        const mCatsById = _.keyBy(aTreeData, 'Objid');

        _.each(_.omit(mGroupedByParents, sRootId), (children, parentId) => (mCatsById[parentId].nodes = children));

        return mGroupedByParents[sRootId];
      },

      async onPressEmployeeSearch(sOrgeh) {
        const oViewModel = this.getViewModel();
        const sSearchText = oViewModel.getProperty('/sideNavigation/search/searchText');

        if (!sSearchText) {
          // MessageBox.alert(this.getBundleText('MSG_00003', 'LABEL_00201')); // {검색어}를 입력하세요.
          return;
        } else if (sSearchText.length < 2) {
          MessageBox.alert(this.getBundleText('MSG_00026')); // 성명은 2자 이상이어야 합니다.
          return;
        }

        oViewModel.setProperty('/sideNavigation/busy', true);

        try {
          const aSearchResults = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Zflag: 'X',
            Stat2: '3',
            Actda: moment().hours(9).toDate(),
            Ename: sSearchText,
            Orgeh: _.isString(sOrgeh) ? sOrgeh : null,
          });

          oViewModel.setProperty(
            '/sideNavigation/search/results',
            _.map(aSearchResults, (o) => ({ ...o, Photo: _.isEmpty(o.Photo) ? 'asset/image/avatar-unknown.svg?ssl=1' : o.Photo }))
          );
        } catch (oError) {
          this.debug('Controller > historyAppraisal > onPressEmployeeSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/sideNavigation/busy', false), 200);
        }
      },

      async onClickEmployeeCard(oEvent) {
        const sPath = oEvent.getSource().getBindingContext().getPath();
        const oViewModel = this.getView().getModel();
        const sPrevPernr = oViewModel.getProperty('/appointee/Pernr');
        const sPernr = oViewModel.getProperty(`${sPath}/Pernr`);

        if (!sPernr) {
          MessageBox.error(this.getBundleText('MSG_00035')); // 대상자 사번이 없습니다.
          return;
        } else if (sPrevPernr === sPernr) {
          return;
        }

        oViewModel.setProperty('/history/busy', true);
        oViewModel.setProperty('/history/mode', 'P');
        oViewModel.setProperty('/history/search', { Otype: 'P', Zyear: null, Objid: sPernr });

        await this.setAppointee(sPernr);
        await this.onPressSearch();
      },

      async onSelectTreeItem(oEvent) {
        const oViewModel = this.getView().getModel();
        const oSelectContext = oEvent.getParameter('listItem').getBindingContext();
        const mSelectedItem = oSelectContext.getProperty();

        if (mSelectedItem.Otype === 'P') {
          oViewModel.setProperty('/history/mode', 'P');
          oViewModel.setProperty('/history/search', { Otype: 'P', Zyear: null, Objid: mSelectedItem.Objid });

          await this.setAppointee(mSelectedItem.Objid);
          await this.onPressSearch();
        } else {
          oViewModel.setProperty('/history/mode', 'O');
          oViewModel.setProperty('/history/search', { Otype: 'O', Zyear: moment().format('YYYY'), Objid: mSelectedItem.Objid });

          await this.onPressSearch();
        }
      },

      async onPressSearch() {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/history/busy', true);

        try {
          const mListPayload = oViewModel.getProperty('/history/search');
          const aRowData = await Client.getEntitySet(this.getModel(ServiceNames.APPRAISAL), 'AppraisalHistory', mListPayload);

          oViewModel.setProperty('/history/rowCount', TableUtils.count({ oTable: this.byId('apprHistoryTable'), aRowData }).rowCount);
          oViewModel.setProperty(
            '/history/list',
            _.map(aRowData, (o) => _.omit(o, '__metadata'))
          );

          this.setVisibleColumns(mListPayload.Otype);
        } catch (oError) {
          this.debug('Controller > historyAppraisal > onPressSearch Error', oError);

          AppUtils.handleError(oError);
        } finally {
          setTimeout(() => oViewModel.setProperty('/history/busy', false), 100);
        }
      },
    });
  }
);
