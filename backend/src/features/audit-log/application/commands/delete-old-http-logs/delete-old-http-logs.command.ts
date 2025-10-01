export class DeleteOldHttpLogsCommand {
  constructor(public readonly cutoffDate: Date) {}
}
