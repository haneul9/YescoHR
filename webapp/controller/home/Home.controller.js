sap.ui.define(
  [
    // prettier 방지용 주석
    'sap/f/dnd/GridDropInfo',
    'sap/ui/core/dnd/DragInfo',
    'sap/ui/core/dnd/DropLayout',
    'sap/ui/core/dnd/DropPosition',
    'sap/ui/model/json/JSONModel',
    'sap/ui/unified/library',
    'sap/ui/unified/CalendarLegendItem',
    'sap/ui/unified/DateTypeRange',
    'sap/ui/yesco/controller/BaseController',
    'sap/ui/yesco/localService/RevealGrid',
  ],
  (
    // prettier 방지용 주석
    GridDropInfo,
    DragInfo,
    DropLayout,
    DropPosition,
    JSONModel,
    unifiedLibrary,
    CalendarLegendItem,
    DateTypeRange,
    BaseController,
    RevealGrid
  ) => {
    'use strict';

    class Home extends BaseController {
      onBeforeShow() {
        // const personalizationGridModel = new JSONModel(sap.ui.require.toUrl('sap/ui/yesco/localService/personalizationGridData.json'));
        const oPersonalizationGridModel = new JSONModel();
        oPersonalizationGridModel.loadData('localService/personalizationGridData.json');
        this.setViewModel(oPersonalizationGridModel, 'personalizationGridModel');

        const oGrid = this.byId('personalization-grid');
        oGrid.addDragDropConfig(
          new DragInfo({
            sourceAggregation: 'items',
          })
        );

        oGrid.addDragDropConfig(
          new GridDropInfo({
            targetAggregation: 'items',
            dropPosition: DropPosition.Between,
            dropLayout: DropLayout.Horizontal,
            drop(oInfo) {
              const oDragged = oInfo.getParameter('draggedControl');
              const oDropped = oInfo.getParameter('droppedControl');
              const sInsertPosition = oInfo.getParameter('dropPosition');
              const iDragPosition = oGrid.indexOfItem(oDragged);
              let iDropPosition = oGrid.indexOfItem(oDropped);

              oGrid.removeItem(oDragged);

              if (iDragPosition < iDropPosition) {
                iDropPosition--;
              }

              if (sInsertPosition === 'After') {
                iDropPosition++;
              }

              oGrid.insertItem(oDragged, iDropPosition);
              // oGrid.focusItem(iDropPosition);

              //
            },
          })
        );

        // Use smaller margin around grid when on smaller screens
        oGrid.attachLayoutChange((oEvent) => {
          const sLayout = oEvent.getParameter('layout');

          if (sLayout === 'layoutXS' || sLayout === 'layoutS') {
            oGrid.removeStyleClass('sapUiSmallMargin');
            oGrid.addStyleClass('sapUiTinyMargin');
          } else {
            oGrid.removeStyleClass('sapUiTinyMargin');
            oGrid.addStyleClass('sapUiSmallMargin');
          }
        });
      }

      // onRevealGrid() {
      //   RevealGrid.toggle('personalization-grid', this.getView());
      // }

      // onExit() {
      //   RevealGrid.destroy('personalization-grid', this.getView());
      // }

      handleShowSpecialDays(oEvent) {
        const oTeamCalendar = this.byId('team-calendar');
        const oTeamCalendarLegend = this.byId('team-calendar-legend');
        const bPressed = oEvent.getParameter('pressed');

        if (bPressed) {
          const oSpecialDates = [
            { date: '2021-09-01', type: 'Type01' },
            { date: '2021-09-02', type: 'Type02' },
            { date: '2021-09-03', type: 'Type03' },
            { date: '2021-09-04', type: 'Type04' },
            { date: '2021-09-05', type: 'Type05' },
            { date: '2021-09-06', type: 'Type06' },
            { date: '2021-09-07', type: 'Type07' },
            { date: '2021-09-08', type: 'Type08' },
            { date: '2021-09-09', type: 'Type09' },
            { date: '2021-09-10', type: 'Type10' },
          ];

          oSpecialDates.forEach(({ date: sDate, type: sType }) => {
            oTeamCalendar.addSpecialDate(
              new DateTypeRange({
                startDate: new Date(sDate),
                type: sType,
                tooltip: '근태 ' + sType,
              })
            );
            oTeamCalendarLegend.addItem(
              new CalendarLegendItem({
                text: '근태 ' + sType,
              })
            );
          });

          oTeamCalendar.addSpecialDate(
            new DateTypeRange({
              startDate: new Date('2021-09-12'),
              type: 'Type11',
            })
          );

          oTeamCalendar.addSpecialDate(
            new DateTypeRange({
              startDate: new Date('2021-09-13'),
              type: 'Type11',
            })
          );

          oTeamCalendar.addSpecialDate(
            new DateTypeRange({
              startDate: new Date('2021-09-11'),
              endDate: new Date('2021-09-21'),
              type: unifiedLibrary.CalendarDayType.NonWorking,
            })
          );

          oTeamCalendar.addSpecialDate(
            new DateTypeRange({
              startDate: new Date('2021-09-24'),
              type: unifiedLibrary.CalendarDayType.NonWorking,
            })
          );
        } else {
          oTeamCalendar.destroySpecialDates();
          oTeamCalendarLegend.destroyItems();
        }
      }
    }

    return Home;
  }
);
