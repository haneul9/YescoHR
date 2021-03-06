sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/ui/yesco/control/MessageBox',
    'sap/ui/yesco/common/AppUtils',
    'sap/ui/yesco/common/odata/Client',
    'sap/ui/yesco/common/odata/ServiceNames',
    'sap/ui/yesco/mvc/controller/BaseController',
  ],
  (
    // prettier 방지용 주석
    MessageBox,
    AppUtils,
    Client,
    ServiceNames,
    BaseController
  ) => {
    'use strict';

    return BaseController.extend('sap.ui.yesco.mvc.controller.commuteType.CommuteType', {
      initializeModel() {
        return {
          busy: false,
          CommuteList: [],
          routeName: '',
          MyCom: {},
          SelectedRow: [],
          searchDate: {},
          listInfo: {
            rowCount: 1,
            totalCount: 0,
            progressCount: 0,
            applyCount: 0,
            approveCount: 0,
            rejectCount: 0,
            completeCount: 0,
          },
        };
      },

      async onObjectMatched(oParameter, sRouteName) {
        const oListModel = this.getViewModel();

        oListModel.setProperty('/routeName', sRouteName);

        try {
          oListModel.setProperty('/busy', true);

          // 나의 근무일정
          const [aMyCom] = await this.getMySchedule();

          oListModel.setProperty('/MyCom', aMyCom);

          const dDate = aMyCom.Zyymm;

          oListModel.setProperty('/searchDate', {
            date: moment(dDate).month('0').format('yyyyMM'),
            secondDate: moment(dDate).format('yyyyMM'),
          });

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oListModel.setProperty('/listInfo', {
            ...this.TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
            isShowApprove: false, // 승인 text hide
            ObjTxt4: this.getBundleText('LABEL_10049'), // 확정취소
            ObjTxt5: this.getBundleText('LABEL_00116'), // 확정
            infoMessage: this.getBundleText('MSG_30004'), // 신청내역에서 선택한 다음 신청 버튼을 클릭하여 주시기 바랍니다.
          });
          oListModel.setProperty('/CommuteList', aTableList);
          this.getAppointeeModel().setProperty('/showChangeButton', this.isHass());
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 대상자 정보 사원선택시 화면 Refresh
      async callbackAppointeeChange() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          // 나의 근무일정
          const [aMyCom] = await this.getMySchedule();

          oListModel.setProperty('/MyCom', aMyCom);

          const dDate = aMyCom.Zyymm;

          oListModel.setProperty('/searchDate', {
            date: moment(dDate).month('0').format('yyyyMM'),
            secondDate: moment(dDate).format('yyyyMM'),
          });

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oListModel.setProperty('/listInfo', {
            ...this.TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
            isShowApprove: false, // 승인 text hide
            ObjTxt4: this.getBundleText('LABEL_10049'), // 확정취소
            ObjTxt5: this.getBundleText('LABEL_00116'), // 확정
          });
          oListModel.setProperty('/CommuteList', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 나의 근무일정 대상년월 Text
      formatSchedule(sYymm = moment().format('yyyy-MM'), dSDate, dEDate) {
        const dS = moment(dSDate).format('yyyy.MM.DD') || moment().format('yyyy.MM.DD');
        const dD = moment(dEDate).format('yyyy.MM.DD') || moment().format('yyyy.MM.DD');

        return `${this.getBundleText('LABEL_30005', moment(sYymm).format('yyyy.MM'), dS, dD)}`;
      },

      onClick() {
        const oListModel = this.getViewModel();
        const aSelectRow = oListModel.getProperty('/SelectedRow');

        if (_.isEmpty(aSelectRow) || _.size(aSelectRow) > 1) {
          // 신청할 데이터를 한 건만 선택하세요.
          MessageBox.alert(this.getBundleText('MSG_30003'));
          return;
        }

        this.getRouter().navTo(`${oListModel.getProperty('/routeName')}-detail`, { oDataKey: 'N', zyymm: aSelectRow[0].Zyymm, schkz: aSelectRow[0].Schkz });
      },

      // override AttachFileCode
      getApprovalType() {
        return 'HR19';
      },

      // 조회
      async onSearch() {
        const oListModel = this.getViewModel();

        try {
          oListModel.setProperty('/busy', true);

          if (this.searchCheck()) {
            return;
          }

          const aTableList = await this.getWorkScheduleList();
          const oTable = this.byId('commuteTable');

          oListModel.setProperty('/listInfo', {
            ...this.TableUtils.count({ oTable, aRowData: aTableList }),
            ObjTxt1: this.getBundleText('LABEL_00197'), // 미신청
            isShowApprove: false, // 승인 text hide
            ObjTxt4: this.getBundleText('LABEL_10049'), // 확정취소
            ObjTxt5: this.getBundleText('LABEL_00116'), // 확정
          });
          oListModel.setProperty('/CommuteList', aTableList);
        } catch (oError) {
          AppUtils.handleError(oError);
        } finally {
          oListModel.setProperty('/busy', false);
        }
      },

      // 조회년월 선택
      onSearchDate() {
        this.searchCheck();
      },

      // 조회년월 체크
      searchCheck() {
        const oListModel = this.getViewModel();
        const mSearch = oListModel.getProperty('/searchDate');

        if (_.parseInt(mSearch.date) > _.parseInt(mSearch.secondDate)) {
          // 조회조건이 잘못 선택 되었습니다.
          MessageBox.alert(this.getBundleText('MSG_30002'));
          return true;
        }

        return false;
      },

      // table 체크박스
      onRowSelection(oEvent) {
        const oListModel = this.getViewModel();
        const vPath = oEvent.getSource().getBindingContext().getPath();
        const aSelectRows = oListModel.getProperty('/SelectedRow');
        let mRow = oListModel.getProperty(vPath);
        let aList = [];

        if (!oEvent.getSource().getSelected()) {
          aList.push(
            ..._.reject(aSelectRows, (o) => {
              return o.Appno === mRow.Appno;
            })
          );
        } else {
          aList.push(...aSelectRows, mRow);
        }

        oListModel.setProperty('/SelectedRow', aList);
      },

      // 나의 근무일정
      async getMySchedule() {
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mMyWorkPayLoad = {
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'MyWorkSchedule', mMyWorkPayLoad);
      },

      // 시차출퇴근신청
      async getWorkScheduleList() {
        const oListModel = this.getViewModel();
        const oModel = this.getModel(ServiceNames.WORKTIME);
        const mSearch = oListModel.getProperty('/searchDate');
        const mPayLoad = {
          Prcty: 'L',
          Begym: mSearch.date,
          Endym: mSearch.secondDate,
          Pernr: this.getAppointeeProperty('Pernr'),
        };

        return await Client.getEntitySet(oModel, 'WorkScheduleApply', mPayLoad);
      },

      onPressExcelDownload() {
        const oTable = this.byId('commuteTable');
        const sFileName = this.getBundleText('LABEL_00282', 'LABEL_30001');

        this.TableUtils.export({ oTable, sFileName });
      },
    });
  }
);
