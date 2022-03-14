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
    'sap/ui/yesco/mvc/model/type/Pernr',
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

    return BaseController.extend('sap.ui.yesco.mvc.controller.historyAppraisal.App', {
      initializeModel() {
        return {
          busy: false,
          isMSS: false,
          sideNavigation: {
            busy: false,
            isShow: true,
            treeLoaded: false,
            treeHeight: '500px',
            scrollHeight: '700px',
            search: { searchText: '', results: [] },
            treeData: [],
          },
          history: {
            busy: false,
            mode: 'P',
            rowCount: 1,
            list: [],
            entryZyear: [],
            search: { Zyear: null, Otype: '', Objid: '' },
            visible: {
              Zyear: true,
              Pernr: false,
              Ename: false,
              idp: false,
            },
          },
          appointee: {},
        };
      },

      async onObjectMatched(mRouteArguments, sRouteName) {
        const oViewModel = this.getViewModel();

        try {
          oViewModel.setSizeLimit(500);
          oViewModel.setData(this.initializeModel());
          oViewModel.setProperty('/busy', true);

          if (sRouteName === 'historyAppraisal') {
            oViewModel.setProperty('/isMSS', false);
          } else {
            const iSideViewHeight = Math.floor($(document).height() - this.byId('sideBody').getParent().$().offset().top - 20);
            const iScrollViewHeight = Math.floor($(document).height() - this.byId('sideEmployeeList').getParent().$().offset().top - 36);

            oViewModel.setProperty('/isMSS', true);
            oViewModel.setProperty('/sideNavigation/height', `${iSideViewHeight}px`);
            oViewModel.setProperty('/sideNavigation/scrollHeight', `${iScrollViewHeight}px`);
            oViewModel.setProperty('/sideNavigation/search/searchText', this.getAppointeeProperty('Orgtx'));

            await this.setAppointee(this.getAppointeeProperty('Pernr'));
            await this.onPressEmployeeSearch();
          }

          oViewModel.setProperty('/history/search', { Otype: 'P', Zyear: null, Objid: this.getAppointeeProperty('Pernr') });

          await this.onPressSearch();
        } catch (oError) {
          this.debug('Controller > historyAppraisal App > onObjectMatched Error', oError);

          AppUtils.handleError(oError);
        } finally {
          oViewModel.setProperty('/busy', false);
        }
      },

      setVisibleColumns(bIsESS, sMode) {
        const oViewModel = this.getViewModel();

        oViewModel.setProperty('/history/visible', {
          idp: !bIsESS,
          Zyear: sMode === 'P',
          Pernr: sMode === 'O',
          Ename: sMode === 'O',
        });
      },

      async setAppointee(sPernr) {
        const oViewModel = this.getViewModel();

        if (_.isEqual(sPernr, this.getSessionProperty('Pernr'))) {
          oViewModel.setProperty('/appointee', { ...this.getSessionData() });
        } else {
          const [mAppointee] = await Client.getEntitySet(this.getModel(ServiceNames.COMMON), 'EmpSearchResult', {
            Ename: sPernr,
          });

          oViewModel.setProperty('/appointee', { ...mAppointee, Orgtx: mAppointee.Fulln, Photo: mAppointee.Photo || 'asset/image/avatar-unknown.svg' });
        }
      },

      onPressRowPerformance(oEvent) {
        const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        this.debug(oRowData);
      },

      onPressRowCompetency(oEvent) {
        const oRowData = oEvent.getSource().getParent().getBindingContext().getObject();

        this.debug(oRowData);
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
          const oSideTree = this.byId('OrganizationTree');
          const aReturnTreeData = await Client.getEntitySet(this.getModel(ServiceNames.PA), 'AuthOrgTree', { Datum: moment().hour(9).toDate(), Xpern: 'X' });
          const mConvertedTreeData = this.transformTreeData({ aTreeData: aReturnTreeData, sRootId: '00000000' });
          const iTreeViewHeight = Math.max(Math.floor($(document).height() - oSideTree.$().offset().top - 35), 500);

          oViewModel.setProperty('/sideNavigation/treeData', mConvertedTreeData);
          oViewModel.setProperty('/sideNavigation/treeHeight', `${iTreeViewHeight}px`);
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

      async onPressEmployeeSearch() {
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

          this.setVisibleColumns(oViewModel.getProperty('/isMSS'), mListPayload.Otype);
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
