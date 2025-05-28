// MongoDB Migration Script for Audit Logs
// Version: 001
// Description: Create audit logs collection with indexes and validation

// Connect to the database (run with: mongosh your_database_name < 001_create_audit_logs.js)

// Create the audit_logs collection with schema validation
db.createCollection("audit_logs", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["id", "timestamp", "action", "level", "actor"],
      properties: {
        id: {
          bsonType: "string",
          description: "Unique identifier for the audit event"
        },
        timestamp: {
          bsonType: "date",
          description: "When the event occurred"
        },
        action: {
          bsonType: "string",
          description: "The action that was performed"
        },
        level: {
          bsonType: "string",
          enum: ["low", "medium", "high", "critical"],
          description: "Audit level for the event"
        },
        actor: {
          bsonType: "object",
          required: ["id", "type"],
          properties: {
            id: { bsonType: "string" },
            type: { bsonType: "string" },
            name: { bsonType: ["string", "null"] },
            email: { bsonType: ["string", "null"] }
          },
          description: "Information about who performed the action"
        },
        resource: {
          bsonType: ["object", "null"],
          properties: {
            id: { bsonType: ["string", "null"] },
            type: { bsonType: ["string", "null"] },
            name: { bsonType: ["string", "null"] }
          },
          description: "Information about the resource that was acted upon"
        },
        context: {
          bsonType: ["object", "null"],
          description: "Additional context information"
        },
        metadata: {
          bsonType: ["object", "null"],
          description: "Additional metadata about the event"
        },
        success: {
          bsonType: ["bool", "null"],
          description: "Whether the action was successful"
        },
        errorMessage: {
          bsonType: ["string", "null"],
          description: "Error message if the action failed"
        },
        durationMs: {
          bsonType: ["int", "null"],
          description: "Duration of the action in milliseconds"
        }
      }
    }
  }
});

// Create indexes for optimal query performance

// Basic indexes
db.audit_logs.createIndex({ "id": 1 }, { unique: true, name: "idx_id" });
db.audit_logs.createIndex({ "timestamp": 1 }, { name: "idx_timestamp" });
db.audit_logs.createIndex({ "action": 1 }, { name: "idx_action" });
db.audit_logs.createIndex({ "level": 1 }, { name: "idx_level" });
db.audit_logs.createIndex({ "success": 1 }, { name: "idx_success" });

// Actor indexes
db.audit_logs.createIndex({ "actor.id": 1 }, { name: "idx_actor_id" });
db.audit_logs.createIndex({ "actor.type": 1 }, { name: "idx_actor_type" });
db.audit_logs.createIndex({ "actor.id": 1, "actor.type": 1 }, { name: "idx_actor_composite" });

// Resource indexes
db.audit_logs.createIndex({ "resource.id": 1 }, { name: "idx_resource_id" });
db.audit_logs.createIndex({ "resource.type": 1 }, { name: "idx_resource_type" });
db.audit_logs.createIndex({ "resource.id": 1, "resource.type": 1 }, { name: "idx_resource_composite" });

// Context indexes for common queries
db.audit_logs.createIndex({ "context.ipAddress": 1 }, { name: "idx_ip_address" });
db.audit_logs.createIndex({ "context.sessionId": 1 }, { name: "idx_session_id" });
db.audit_logs.createIndex({ "context.requestId": 1 }, { name: "idx_request_id" });

// Compound indexes for common query patterns
db.audit_logs.createIndex({ "timestamp": 1, "action": 1 }, { name: "idx_timestamp_action" });
db.audit_logs.createIndex({ "actor.id": 1, "timestamp": 1 }, { name: "idx_actor_timestamp" });
db.audit_logs.createIndex({ "resource.id": 1, "timestamp": 1 }, { name: "idx_resource_timestamp" });
db.audit_logs.createIndex({ "action": 1, "level": 1 }, { name: "idx_action_level" });
db.audit_logs.createIndex({ "actor.type": 1, "action": 1 }, { name: "idx_actor_type_action" });
db.audit_logs.createIndex({ "resource.type": 1, "action": 1 }, { name: "idx_resource_type_action" });

// Time-based partitioning index (for TTL if needed)
db.audit_logs.createIndex({ "timestamp": 1 }, { 
  name: "idx_timestamp_ttl",
  // Uncomment the next line to enable automatic deletion after 1 year
  // expireAfterSeconds: 31536000  // 365 days
});

// Text index for full-text search
db.audit_logs.createIndex({
  "action": "text",
  "actor.name": "text",
  "actor.email": "text",
  "resource.name": "text",
  "metadata": "text",
  "context": "text",
  "errorMessage": "text"
}, {
  name: "idx_text_search",
  weights: {
    "action": 10,
    "actor.name": 8,
    "actor.email": 8,
    "resource.name": 6,
    "errorMessage": 5,
    "metadata": 3,
    "context": 2
  }
});

// Create capped collection for real-time audit events (optional)
db.createCollection("audit_logs_realtime", {
  capped: true,
  size: 10485760, // 10MB
  max: 10000      // Max 10,000 documents
});

// Create indexes for real-time collection
db.audit_logs_realtime.createIndex({ "timestamp": 1 }, { name: "idx_realtime_timestamp" });
db.audit_logs_realtime.createIndex({ "actor.id": 1 }, { name: "idx_realtime_actor" });

// Create aggregation views for common statistics

// Daily statistics view
db.createView("daily_audit_stats", "audit_logs", [
  {
    $group: {
      _id: {
        date: { $dateToString: { format: "%Y-%m-%d", date: "$timestamp" } },
        action: "$action",
        level: "$level",
        success: "$success"
      },
      count: { $sum: 1 },
      avgDuration: { $avg: "$durationMs" },
      uniqueActors: { $addToSet: "$actor.id" },
      firstOccurrence: { $min: "$timestamp" },
      lastOccurrence: { $max: "$timestamp" }
    }
  },
  {
    $project: {
      date: "$_id.date",
      action: "$_id.action",
      level: "$_id.level",
      success: "$_id.success",
      count: 1,
      avgDuration: 1,
      uniqueActorCount: { $size: "$uniqueActors" },
      firstOccurrence: 1,
      lastOccurrence: 1
    }
  },
  {
    $sort: { "_id.date": -1, count: -1 }
  }
]);

// Actor activity view
db.createView("actor_activity_stats", "audit_logs", [
  {
    $group: {
      _id: {
        actorId: "$actor.id",
        actorType: "$actor.type"
      },
      actorName: { $first: "$actor.name" },
      actorEmail: { $first: "$actor.email" },
      totalEvents: { $sum: 1 },
      successfulEvents: {
        $sum: { $cond: [{ $eq: ["$success", true] }, 1, 0] }
      },
      failedEvents: {
        $sum: { $cond: [{ $eq: ["$success", false] }, 1, 0] }
      },
      uniqueActions: { $addToSet: "$action" },
      uniqueResources: { $addToSet: "$resource.id" },
      firstActivity: { $min: "$timestamp" },
      lastActivity: { $max: "$timestamp" },
      avgDuration: { $avg: "$durationMs" }
    }
  },
  {
    $project: {
      actorId: "$_id.actorId",
      actorType: "$_id.actorType",
      actorName: 1,
      actorEmail: 1,
      totalEvents: 1,
      successfulEvents: 1,
      failedEvents: 1,
      uniqueActionCount: { $size: "$uniqueActions" },
      uniqueResourceCount: { $size: "$uniqueResources" },
      firstActivity: 1,
      lastActivity: 1,
      avgDuration: 1,
      successRate: {
        $multiply: [
          { $divide: ["$successfulEvents", "$totalEvents"] },
          100
        ]
      }
    }
  },
  {
    $sort: { totalEvents: -1, lastActivity: -1 }
  }
]);

// Resource access view
db.createView("resource_access_stats", "audit_logs", [
  {
    $match: { "resource.id": { $exists: true, $ne: null } }
  },
  {
    $group: {
      _id: {
        resourceId: "$resource.id",
        resourceType: "$resource.type"
      },
      resourceName: { $first: "$resource.name" },
      totalAccesses: { $sum: 1 },
      uniqueActors: { $addToSet: "$actor.id" },
      uniqueActions: { $addToSet: "$action" },
      successfulAccesses: {
        $sum: { $cond: [{ $eq: ["$success", true] }, 1, 0] }
      },
      failedAccesses: {
        $sum: { $cond: [{ $eq: ["$success", false] }, 1, 0] }
      },
      firstAccess: { $min: "$timestamp" },
      lastAccess: { $max: "$timestamp" },
      avgDuration: { $avg: "$durationMs" }
    }
  },
  {
    $project: {
      resourceId: "$_id.resourceId",
      resourceType: "$_id.resourceType",
      resourceName: 1,
      totalAccesses: 1,
      uniqueActorCount: { $size: "$uniqueActors" },
      uniqueActionCount: { $size: "$uniqueActions" },
      successfulAccesses: 1,
      failedAccesses: 1,
      firstAccess: 1,
      lastAccess: 1,
      avgDuration: 1,
      accessSuccessRate: {
        $multiply: [
          { $divide: ["$successfulAccesses", "$totalAccesses"] },
          100
        ]
      }
    }
  },
  {
    $sort: { totalAccesses: -1, lastAccess: -1 }
  }
]);

// Security monitoring view for suspicious activities
db.createView("security_events", "audit_logs", [
  {
    $match: {
      $or: [
        { level: "critical" },
        { success: false },
        { action: { $regex: /security|breach|attack|fail|error/i } },
        { "context.suspicious": true }
      ]
    }
  },
  {
    $sort: { timestamp: -1 }
  }
]);

// Action frequency view
db.createView("action_frequency", "audit_logs", [
  {
    $group: {
      _id: "$action",
      count: { $sum: 1 },
      uniqueActors: { $addToSet: "$actor.id" },
      uniqueResources: { $addToSet: "$resource.id" },
      successRate: {
        $avg: { $cond: [{ $eq: ["$success", true] }, 100, 0] }
      },
      avgDuration: { $avg: "$durationMs" },
      lastOccurrence: { $max: "$timestamp" }
    }
  },
  {
    $project: {
      action: "$_id",
      count: 1,
      uniqueActorCount: { $size: "$uniqueActors" },
      uniqueResourceCount: { $size: "$uniqueResources" },
      successRate: 1,
      avgDuration: 1,
      lastOccurrence: 1
    }
  },
  {
    $sort: { count: -1 }
  }
]);

// Create sample indexes for common aggregation patterns
db.audit_logs.createIndex({ "timestamp": 1, "level": 1 }, { name: "idx_timestamp_level" });
db.audit_logs.createIndex({ "actor.type": 1, "timestamp": 1 }, { name: "idx_actor_type_timestamp" });
db.audit_logs.createIndex({ "resource.type": 1, "timestamp": 1 }, { name: "idx_resource_type_timestamp" });

// Print completion message
print("MongoDB audit logs migration completed successfully");
print("Collections created: audit_logs, audit_logs_realtime");
print("Views created: daily_audit_stats, actor_activity_stats, resource_access_stats, security_events, action_frequency");
print("Indexes created for optimal query performance");

// Optional: Create a function to clean up old audit logs
db.system.js.save({
  _id: "cleanupOldAuditLogs",
  value: function(daysToKeep = 365) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
    
    const result = db.audit_logs.deleteMany({
      timestamp: { $lt: cutoffDate }
    });
    
    return {
      deleted: result.deletedCount,
      cutoffDate: cutoffDate
    };
  }
});

print("Cleanup function 'cleanupOldAuditLogs' created");
print("Usage: db.eval('cleanupOldAuditLogs(30)') // Keep only last 30 days");
