import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { authorize } from "@/lib/qcos/authz";
import { AuditLogger } from "@/lib/qcos/audit-logger";

const experimentSchema = z.object({
  flagKey: z.string().regex(/^[a-z][a-z0-9_.-]*$/).max(100), name: z.string().min(1).max(100), description: z.string().max(1000).optional(),
  startsAt: z.string().datetime(), endsAt: z.string().datetime(),
  variants: z.array(z.object({ name: z.string().min(1).max(50), trafficPct: z.number().min(0).max(100), properties: z.record(z.string(), z.unknown()) })).min(2).max(10),
}).superRefine((value, context) => {
  const total = value.variants.reduce((sum, variant) => sum + variant.trafficPct, 0);
  if (Math.abs(total - 100) > 0.001) context.addIssue({ code: "custom", path: ["variants"], message: "Variant traffic must total 100%" });
  if (new Date(value.endsAt) <= new Date(value.startsAt)) context.addIssue({ code: "custom", path: ["endsAt"], message: "End time must be after start time" });
});

export async function GET(request: Request) { const auth=await authorize(request,"cxp.view");if(auth.response)return auth.response;return NextResponse.json({success:true,data:await prisma.qcos_experiments.findMany({include:{flag:true,variants:true},orderBy:{created_at:"desc"}})}) }
export async function POST(request: Request) { const auth=await authorize(request,"cxp.audience.manage");if(auth.response||!auth.session)return auth.response;const parsed=experimentSchema.safeParse(await request.json().catch(()=>null));if(!parsed.success)return NextResponse.json({success:false,error:"Invalid experiment",issues:parsed.error.issues},{status:422});const input=parsed.data;const experiment=await prisma.$transaction(async tx=>{const flag=await tx.qcos_feature_flags.upsert({where:{flag_key:input.flagKey},update:{description:input.description},create:{flag_key:input.flagKey,description:input.description,is_enabled:true}});return tx.qcos_experiments.create({data:{flag_id:flag.id,name:input.name,description:input.description,status:"draft",starts_at:new Date(input.startsAt),ends_at:new Date(input.endsAt),variants:{create:input.variants.map(v=>({name:v.name,traffic_pct:v.trafficPct,properties_json:JSON.stringify(v.properties)}))}},include:{flag:true,variants:true}})});await AuditLogger.log(auth.session.userId,"CREATE","qcos_experiments",experiment.id,null,{name:experiment.name,flagKey:input.flagKey});return NextResponse.json({success:true,data:experiment},{status:201}) }
