import type { Metadata } from "next"

import { getSecurityOverview } from "@/lib/actions/security.actions"
import { requireAdmin } from "@/lib/auth-guard"
import { formatDateTime } from "@/lib/utils"

import { BlockIpButton, UnblockIpButton } from "@/components/admin/security-actions"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

export const metadata: Metadata = {
  title: "Security",
}

export default async function SecurityPage() {
  await requireAdmin()
  const { blocked, failedLogins, alerts } = await getSecurityOverview()

  return (
    <div className="space-y-6">
      <h1 className="h2-bold">Security</h1>

      <section className="space-y-2">
        <h2 className="h3-bold">Blocked IPs ({blocked.length})</h2>
        {blocked.length === 0 ? (
          <p className="text-muted-foreground text-sm">No blocked IPs.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>IP</TableHead>
                <TableHead>Reason</TableHead>
                <TableHead>Blocked at</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {blocked.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.ip}</TableCell>
                  <TableCell>{b.reason ?? "—"}</TableCell>
                  <TableCell>{formatDateTime(b.createdAt).dateTime}</TableCell>
                  <TableCell><UnblockIpButton ip={b.ip} /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="h3-bold">Recent failed logins</h2>
        {failedLogins.length === 0 ? (
          <p className="text-muted-foreground text-sm">No failed logins.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Time</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>IP</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {failedLogins.map((l) => (
                <TableRow key={l.id}>
                  <TableCell>{formatDateTime(l.loginAt).dateTime}</TableCell>
                  <TableCell>{l.user?.email ?? "—"}</TableCell>
                  <TableCell>{l.ipAddress ?? "—"}</TableCell>
                  <TableCell>{l.browser ?? "?"} · {l.device ?? "?"}</TableCell>
                  <TableCell>{l.location ?? "—"}</TableCell>
                  <TableCell>
                    {l.ipAddress && l.ipAddress !== "unknown" ? (
                      <BlockIpButton ip={l.ipAddress} />
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="h3-bold">Alerts</h2>
        {alerts.length === 0 ? (
          <p className="text-muted-foreground text-sm">No alerts.</p>
        ) : (
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className="rounded-md border p-2 text-sm">
                <div className="flex items-center justify-between">
                  <Badge variant={a.action.includes("bruteforce") ? "destructive" : "secondary"}>
                    {a.action}
                  </Badge>
                  <span className="text-muted-foreground">
                    {formatDateTime(a.createdAt).dateTime}
                  </span>
                </div>
                <div className="text-muted-foreground">
                  {a.ipAddress ?? "—"} · {a.location ?? "—"}
                  {a.reason ? ` · ${a.reason}` : ""}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}