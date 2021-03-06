sap.ui.define(
    [
      // prettier 방지용 주석
      'sap/ui/yesco/common/odata/ServiceNames',
      'sap/ui/yesco/common/AppUtils',
      'sap/ui/yesco/common/odata/Client',
      'sap/ui/yesco/mvc/controller/BaseController',
    ],
    (
      // prettier 방지용 주석
      ServiceNames,
      AppUtils,
      Client,
      BaseController
    ) => {
      'use strict';
  
      return BaseController.extend('sap.ui.yesco.mvc.controller.holidayWork.mobile.List', {
          
        initializeModel() {
          return {
            busy: false,
            search: {
              dateRange: '12m',
              secondDate: moment().toDate(),
              date: moment().subtract(12, 'months').toDate(),
              dateBox: false,
            },
            Data: [],
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
  
        async onObjectMatched() {
          this.onSearchRange();
        },
  
        // 날짜선택
        async onSearchRange() {
          const oViewModel = this.getViewModel();
  
          try {
            oViewModel.setProperty('/busy', true);
  
            const aList = await this.getList();
  
            oViewModel.setProperty('/list', aList);
            oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
          } catch (oError) {
            AppUtils.handleError(oError);
          } finally {
            oViewModel.setProperty('/busy', false);
          }
        },
  
        // 신청내역 조회
        async getList() {
          const oViewModel = this.getViewModel();
          const oModel = this.getModel(ServiceNames.WORKTIME);
          const mSearch = oViewModel.getProperty('/search');
          const mPayLoad = {
            Menid: this.getCurrentMenuId(),
            Pernr: this.getAppointeeProperty('Pernr'),
            Apbeg: moment(mSearch.date).hours(9).toDate(),
            Apend: moment(mSearch.secondDate).hours(9).toDate(),
          };
  
          const aResult = await Client.getEntitySet(oModel, 'OtWorkApply2', mPayLoad);
          const aSubtyEntry = [
            { Zcode: '2230', Ztext: this.getBundleText('LABEL_41004') }, // 휴일대체
            { Zcode: '2231', Ztext: this.getBundleText('LABEL_41014') }, // 대체(오전)
            { Zcode: '2232', Ztext: this.getBundleText('LABEL_41015') }  // 대체(오후)
          ];

          // 휴일대체 구분 텍스트 재설정
          const aData = _.map(aResult, (o) => {
            return _.set(o, 'Subtytx', _.chain(aSubtyEntry).find({ Zcode: o.Subty }).get('Ztext').value());
          });

          // '대상자 = 로그인 사번'인 경우만 세팅
          return _.filter(aData, (e) => {
            return e.Pernr === this.getAppointeeProperty('Pernr');
          });
        },
  
        // 검색 날짜 선택
        async onSearchList(oEvent) {
          const oViewModel = this.getViewModel();
          oViewModel.setProperty('/busy', true);
  
          try {
            const sKey = oEvent.getSource().getSelectedKey();
            const dEndda = moment();
  
            switch (sKey) {
              case '1w':
                dEndda.subtract(7, 'day');
                break;
              case '1m':
                dEndda.subtract(1, 'months');
                break;
              case '3m':
                dEndda.subtract(3, 'months');
                break;
              case '6m':
                dEndda.subtract(6, 'months');
                break;
              case '12m':
                dEndda.subtract(12, 'months');
                break;
              default:
                break;
            }
  
            const bDateRangeBox = sKey === '0';
            if (!bDateRangeBox) {
              oViewModel.setProperty('/search/secondDate', moment().toDate());
              oViewModel.setProperty('/search/date', dEndda.toDate());
  
              const aList = await this.getList();
  
              oViewModel.setProperty('/list', aList);
              oViewModel.setProperty('/listInfo/totalCount', _.size(aList));
            }
  
            oViewModel.setProperty('/search/dateBox', bDateRangeBox);
          } catch (oError) {
            AppUtils.handleError(oError);
          } finally {
            oViewModel.setProperty('/busy', false);
          }
        },
  
        onSelectRow(oEvent) {
          const oViewModel = this.getViewModel();
          const vPath = oEvent.getSource().getBindingContext().getPath();
          const oRowData = this.getViewModel().getProperty(vPath);
  
          if (isNaN(oRowData.Appno)) return;
  
          oViewModel.setProperty('/parameter/rowData', [oRowData]);
          this.getRouter().navTo('mobile/holidayWork-detail', { appno: _.isEqual(oRowData.Appno, '00000000000000') ? 'n' : oRowData.Appno });
        },
  
        onPressNewApprovalBtn() {
          this.getRouter().navTo('mobile/holidayWork-detail', { appno: 'n' });
        },
  
        setRowActionParameters() {
          const oViewModel = this.getViewModel();
          const aSelectedIndices = oViewModel.getProperty('/parameter/selectedIndices');
  
          oViewModel.setProperty(
            '/parameter/rowData',
            aSelectedIndices.map((idx) => oViewModel.getProperty(`/list/${idx}`))
          );
        },
  
        onChangeIndication(sValue) {
          return sValue === 'A' ? 'Indication05' : sValue === 'B' ? 'Indication03' : 'Indication04';
        },

        formatSubda(fVal){
          return fVal.substring(5);
        }
      });
    }
  );
  