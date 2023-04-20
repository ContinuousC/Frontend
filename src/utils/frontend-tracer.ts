/******************************************************************************
 * Copyright ContinuousC. Licensed under the "Elastic License 2.0".           *
 ******************************************************************************/

import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "@opentelemetry/core";
import { context, trace, Span } from "@opentelemetry/api";
import { WebTracerProvider } from "@opentelemetry/sdk-trace-web";
import { BatchSpanProcessor } from "@opentelemetry/sdk-trace-base";
import { registerInstrumentations } from "@opentelemetry/instrumentation";
import { getWebAutoInstrumentations } from "@opentelemetry/auto-instrumentations-web";
import { Resource } from "@opentelemetry/resources";
import { ATTR_SERVICE_NAME } from "@opentelemetry/semantic-conventions";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";

const FrontendTracer = async () => {
  const { ZoneContextManager } = await import("@opentelemetry/context-zone");

  const provider = new WebTracerProvider({
    resource: new Resource({
      [ATTR_SERVICE_NAME]: "continuousc-frontend",
    }),
    spanProcessors: [
      new BatchSpanProcessor(
        new OTLPTraceExporter({
          url: "/v1/traces",
        })
      )
    ]
  });

  const contextManager = new ZoneContextManager();

  provider.register({
    contextManager,
    propagator: new CompositePropagator({
      propagators: [
        new W3CBaggagePropagator(),
        new W3CTraceContextPropagator(),
      ],
    }),
  });

  registerInstrumentations({
    tracerProvider: provider,
    instrumentations: [
      getWebAutoInstrumentations({
        "@opentelemetry/instrumentation-fetch": {
          propagateTraceHeaderCorsUrls: /.*/,
          clearTimingResources: true,
          applyCustomAttributesOnSpan(span) {
            span.setAttribute("app.synthetic_request", "false");
          },
        },
      }),
    ],
  });
};

export default FrontendTracer;

export function traceAsync<T extends any[], U>(
  span: Span | undefined,
  msg: string,
  prom: (...args: T) => Promise<U>
): (...args: T) => Promise<U> {
  return span ? async (...args) => {
    const tracer = trace.getTracer("default");
    const ctx = trace.setSpan(context.active(), span);
    // return tracer.startActiveSpan(msg, {}, ctx, async () => await prom(...args));
    const subSpan = tracer.startSpan(msg, undefined, ctx);
    const subCtx = trace.setSpan(ctx, subSpan);
    return context.with(subCtx, async () => {
      const r = await prom(...args);
      subSpan.end();
      return r;
    });
  } : prom;
}

export function traceFun<T>(
  span: Span | undefined,
  msg: string,
  fun: (...args: any[]) => T
): (...args: any[]) => T {
  return span ? (...args) => {
    const tracer = trace.getTracer("default");
    const ctx = trace.setSpan(context.active(), span);
    const subSpan = tracer.startSpan(msg, undefined, ctx);
    const subCtx = trace.setSpan(ctx, subSpan);
    const r = context.with(subCtx, () => fun(...args));
    subSpan.end();
    return r;
  } : fun;
}
